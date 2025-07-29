from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class Message(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    driver_id: str
    customer_name: str
    text: str
    sender: str  # "driver" or "customer"
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class MessageCreate(BaseModel):
    driver_id: str
    customer_name: str
    text: str
    sender: str

class DeliveryLocation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    driver_id: str
    customer_name: str
    customer_phone: str
    address: str
    latitude: float
    longitude: float
    status: str = "pending"  # pending, in_progress, delivered
    order_details: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class DeliveryLocationCreate(BaseModel):
    driver_id: str
    customer_name: str
    customer_phone: str
    address: str
    latitude: float
    longitude: float
    order_details: str

# Chat endpoints
@api_router.post("/messages", response_model=Message)
async def send_message(message: MessageCreate):
    message_obj = Message(**message.dict())
    await db.messages.insert_one(message_obj.dict())
    return message_obj

@api_router.get("/messages/{driver_id}", response_model=List[Message])
async def get_driver_messages(driver_id: str):
    messages = await db.messages.find({"driver_id": driver_id}).sort("timestamp", 1).to_list(1000)
    return [Message(**msg) for msg in messages]

@api_router.get("/messages/{driver_id}/{customer_name}", response_model=List[Message])
async def get_conversation(driver_id: str, customer_name: str):
    messages = await db.messages.find({
        "driver_id": driver_id,
        "customer_name": customer_name
    }).sort("timestamp", 1).to_list(1000)
    return [Message(**msg) for msg in messages]

# Delivery location endpoints
@api_router.post("/deliveries", response_model=DeliveryLocation)
async def create_delivery(delivery: DeliveryLocationCreate):
    delivery_obj = DeliveryLocation(**delivery.dict())
    await db.deliveries.insert_one(delivery_obj.dict())
    return delivery_obj

@api_router.get("/deliveries/{driver_id}", response_model=List[DeliveryLocation])
async def get_driver_deliveries(driver_id: str):
    deliveries = await db.deliveries.find({"driver_id": driver_id}).sort("created_at", -1).to_list(1000)
    return [DeliveryLocation(**delivery) for delivery in deliveries]

@api_router.put("/deliveries/{delivery_id}/status")
async def update_delivery_status(delivery_id: str, status: str):
    await db.deliveries.update_one(
        {"id": delivery_id},
        {"$set": {"status": status}}
    )
    return {"message": "Status updated successfully"}

# Driver endpoints
@api_router.get("/driver/{driver_id}/active-customers")
async def get_active_customers(driver_id: str):
    # Get unique customers from recent deliveries
    pipeline = [
        {"$match": {"driver_id": driver_id, "status": {"$in": ["pending", "in_progress"]}}},
        {"$group": {
            "_id": "$customer_name",
            "customer_phone": {"$first": "$customer_phone"},
            "latest_order": {"$first": "$order_details"},
            "delivery_id": {"$first": "$id"}
        }}
    ]
    
    customers = await db.deliveries.aggregate(pipeline).to_list(1000)
    return customers

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Food Delivery Driver API"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()