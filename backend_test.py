#!/usr/bin/env python3
"""
Backend API Testing Script for Food Delivery Driver App
Tests all endpoints with realistic sample data
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, List, Any

# Backend URL from frontend/.env
BACKEND_URL = "https://49b9994f-5e41-4b65-b60d-6ac20b12a93a.preview.emergentagent.com/api"

# Test data
DRIVER_ID = "driver_001"
CUSTOMERS = [
    {
        "name": "Sarah Johnson",
        "phone": "+1-555-0123",
        "address": "123 Oak Street, Downtown",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "order": "2x Margherita Pizza, 1x Caesar Salad"
    },
    {
        "name": "Mike Chen",
        "phone": "+1-555-0456",
        "address": "456 Pine Avenue, Midtown",
        "latitude": 40.7589,
        "longitude": -73.9851,
        "order": "1x Chicken Teriyaki Bowl, 1x Miso Soup"
    },
    {
        "name": "Emily Rodriguez",
        "phone": "+1-555-0789",
        "address": "789 Maple Drive, Uptown",
        "latitude": 40.7831,
        "longitude": -73.9712,
        "order": "1x Beef Burger, 1x Fries, 1x Coke"
    }
]

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.test_results = []
        self.created_deliveries = []
        self.created_messages = []

    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if response_data and isinstance(response_data, dict):
            print(f"   Response: {json.dumps(response_data, indent=2, default=str)}")
        print()
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'details': details,
            'response': response_data
        })

    def test_root_endpoint(self):
        """Test GET /api/ - Root endpoint"""
        try:
            response = self.session.get(f"{BACKEND_URL}/")
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data:
                    self.log_test("Root Endpoint", True, f"Status: {response.status_code}", data)
                    return True
                else:
                    self.log_test("Root Endpoint", False, "Missing 'message' field in response", data)
                    return False
            else:
                self.log_test("Root Endpoint", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Root Endpoint", False, f"Exception: {str(e)}")
            return False

    def test_create_deliveries(self):
        """Test POST /api/deliveries - Create new deliveries"""
        success_count = 0
        
        for customer in CUSTOMERS:
            try:
                delivery_data = {
                    "driver_id": DRIVER_ID,
                    "customer_name": customer["name"],
                    "customer_phone": customer["phone"],
                    "address": customer["address"],
                    "latitude": customer["latitude"],
                    "longitude": customer["longitude"],
                    "order_details": customer["order"]
                }
                
                response = self.session.post(f"{BACKEND_URL}/deliveries", json=delivery_data)
                
                if response.status_code == 200:
                    data = response.json()
                    if "id" in data and data["driver_id"] == DRIVER_ID:
                        self.created_deliveries.append(data)
                        self.log_test(f"Create Delivery - {customer['name']}", True, 
                                    f"Created delivery ID: {data['id']}", data)
                        success_count += 1
                    else:
                        self.log_test(f"Create Delivery - {customer['name']}", False, 
                                    "Missing required fields in response", data)
                else:
                    self.log_test(f"Create Delivery - {customer['name']}", False, 
                                f"Status: {response.status_code}, Response: {response.text}")
                    
            except Exception as e:
                self.log_test(f"Create Delivery - {customer['name']}", False, f"Exception: {str(e)}")
        
        return success_count == len(CUSTOMERS)

    def test_get_driver_deliveries(self):
        """Test GET /api/deliveries/{driver_id} - Get deliveries for a driver"""
        try:
            response = self.session.get(f"{BACKEND_URL}/deliveries/{DRIVER_ID}")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) >= len(self.created_deliveries):
                    self.log_test("Get Driver Deliveries", True, 
                                f"Retrieved {len(data)} deliveries", {"count": len(data)})
                    return True
                else:
                    self.log_test("Get Driver Deliveries", False, 
                                f"Expected list with at least {len(self.created_deliveries)} items, got: {type(data)}")
                    return False
            else:
                self.log_test("Get Driver Deliveries", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Get Driver Deliveries", False, f"Exception: {str(e)}")
            return False

    def test_update_delivery_status(self):
        """Test PUT /api/deliveries/{delivery_id}/status - Update delivery status"""
        if not self.created_deliveries:
            self.log_test("Update Delivery Status", False, "No deliveries created to test with")
            return False
        
        success_count = 0
        statuses = ["in_progress", "delivered"]
        
        for i, delivery in enumerate(self.created_deliveries[:2]):  # Test first 2 deliveries
            try:
                status = statuses[i % len(statuses)]
                response = self.session.put(
                    f"{BACKEND_URL}/deliveries/{delivery['id']}/status",
                    params={"status": status}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if "message" in data:
                        self.log_test(f"Update Status - {delivery['customer_name']}", True, 
                                    f"Updated to '{status}'", data)
                        success_count += 1
                    else:
                        self.log_test(f"Update Status - {delivery['customer_name']}", False, 
                                    "Missing 'message' field in response", data)
                else:
                    self.log_test(f"Update Status - {delivery['customer_name']}", False, 
                                f"Status: {response.status_code}, Response: {response.text}")
                    
            except Exception as e:
                self.log_test(f"Update Status - {delivery['customer_name']}", False, f"Exception: {str(e)}")
        
        return success_count > 0

    def test_send_messages(self):
        """Test POST /api/messages - Send messages between driver and customers"""
        success_count = 0
        
        # Test messages from driver to customers
        driver_messages = [
            {"customer": "Sarah Johnson", "text": "Hi Sarah! I'm on my way with your pizza order. ETA 10 minutes.", "sender": "driver"},
            {"customer": "Mike Chen", "text": "Hello Mike! Your teriyaki bowl is ready and I'm heading to your location.", "sender": "driver"},
            {"customer": "Sarah Johnson", "text": "I'm outside your building now. Could you come down?", "sender": "driver"}
        ]
        
        # Test messages from customers to driver
        customer_messages = [
            {"customer": "Sarah Johnson", "text": "Great! I'll be right down.", "sender": "customer"},
            {"customer": "Mike Chen", "text": "Perfect timing! I'm in apartment 4B.", "sender": "customer"},
            {"customer": "Emily Rodriguez", "text": "Hi! Is my burger order ready?", "sender": "customer"}
        ]
        
        all_messages = driver_messages + customer_messages
        
        for msg in all_messages:
            try:
                message_data = {
                    "driver_id": DRIVER_ID,
                    "customer_name": msg["customer"],
                    "text": msg["text"],
                    "sender": msg["sender"]
                }
                
                response = self.session.post(f"{BACKEND_URL}/messages", json=message_data)
                
                if response.status_code == 200:
                    data = response.json()
                    if "id" in data and data["driver_id"] == DRIVER_ID:
                        self.created_messages.append(data)
                        self.log_test(f"Send Message - {msg['sender']} to {msg['customer']}", True, 
                                    f"Message ID: {data['id']}")
                        success_count += 1
                    else:
                        self.log_test(f"Send Message - {msg['sender']} to {msg['customer']}", False, 
                                    "Missing required fields in response", data)
                else:
                    self.log_test(f"Send Message - {msg['sender']} to {msg['customer']}", False, 
                                f"Status: {response.status_code}, Response: {response.text}")
                    
            except Exception as e:
                self.log_test(f"Send Message - {msg['sender']} to {msg['customer']}", False, f"Exception: {str(e)}")
        
        return success_count == len(all_messages)

    def test_get_driver_messages(self):
        """Test GET /api/messages/{driver_id} - Get all messages for a driver"""
        try:
            response = self.session.get(f"{BACKEND_URL}/messages/{DRIVER_ID}")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) >= len(self.created_messages):
                    self.log_test("Get Driver Messages", True, 
                                f"Retrieved {len(data)} messages", {"count": len(data)})
                    return True
                else:
                    self.log_test("Get Driver Messages", False, 
                                f"Expected list with at least {len(self.created_messages)} items, got: {type(data)}")
                    return False
            else:
                self.log_test("Get Driver Messages", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Get Driver Messages", False, f"Exception: {str(e)}")
            return False

    def test_get_conversation(self):
        """Test GET /api/messages/{driver_id}/{customer_name} - Get conversation with specific customer"""
        success_count = 0
        test_customers = ["Sarah Johnson", "Mike Chen"]
        
        for customer in test_customers:
            try:
                response = self.session.get(f"{BACKEND_URL}/messages/{DRIVER_ID}/{customer}")
                
                if response.status_code == 200:
                    data = response.json()
                    if isinstance(data, list):
                        # Check if all messages are for the correct customer
                        valid_conversation = all(msg.get("customer_name") == customer for msg in data)
                        if valid_conversation:
                            self.log_test(f"Get Conversation - {customer}", True, 
                                        f"Retrieved {len(data)} messages", {"count": len(data)})
                            success_count += 1
                        else:
                            self.log_test(f"Get Conversation - {customer}", False, 
                                        "Messages contain wrong customer names")
                    else:
                        self.log_test(f"Get Conversation - {customer}", False, 
                                    f"Expected list, got: {type(data)}")
                else:
                    self.log_test(f"Get Conversation - {customer}", False, 
                                f"Status: {response.status_code}, Response: {response.text}")
                    
            except Exception as e:
                self.log_test(f"Get Conversation - {customer}", False, f"Exception: {str(e)}")
        
        return success_count == len(test_customers)

    def test_get_active_customers(self):
        """Test GET /api/driver/{driver_id}/active-customers - Get active customers for a driver"""
        try:
            response = self.session.get(f"{BACKEND_URL}/driver/{DRIVER_ID}/active-customers")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    # Should have customers with pending/in_progress deliveries
                    self.log_test("Get Active Customers", True, 
                                f"Retrieved {len(data)} active customers", {"count": len(data), "customers": data})
                    return True
                else:
                    self.log_test("Get Active Customers", False, 
                                f"Expected list, got: {type(data)}")
                    return False
            else:
                self.log_test("Get Active Customers", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Get Active Customers", False, f"Exception: {str(e)}")
            return False

    def test_error_handling(self):
        """Test error handling for invalid requests"""
        error_tests = [
            {
                "name": "Invalid Driver ID - Messages",
                "url": f"{BACKEND_URL}/messages/invalid_driver_id",
                "method": "GET"
            },
            {
                "name": "Invalid Delivery ID - Status Update",
                "url": f"{BACKEND_URL}/deliveries/invalid_delivery_id/status",
                "method": "PUT",
                "params": {"status": "delivered"}
            },
            {
                "name": "Missing Required Fields - Create Message",
                "url": f"{BACKEND_URL}/messages",
                "method": "POST",
                "json": {"driver_id": DRIVER_ID}  # Missing required fields
            }
        ]
        
        success_count = 0
        for test in error_tests:
            try:
                if test["method"] == "GET":
                    response = self.session.get(test["url"])
                elif test["method"] == "PUT":
                    response = self.session.put(test["url"], params=test.get("params", {}))
                elif test["method"] == "POST":
                    response = self.session.post(test["url"], json=test.get("json", {}))
                
                # For error handling, we expect either proper error responses or empty results
                if response.status_code in [200, 400, 404, 422]:
                    self.log_test(test["name"], True, f"Status: {response.status_code}")
                    success_count += 1
                else:
                    self.log_test(test["name"], False, f"Unexpected status: {response.status_code}")
                    
            except Exception as e:
                self.log_test(test["name"], False, f"Exception: {str(e)}")
        
        return success_count > 0

    def run_all_tests(self):
        """Run all backend API tests"""
        print("=" * 60)
        print("FOOD DELIVERY DRIVER BACKEND API TESTS")
        print("=" * 60)
        print(f"Backend URL: {BACKEND_URL}")
        print(f"Test Driver ID: {DRIVER_ID}")
        print("=" * 60)
        print()
        
        # Run tests in logical order
        tests = [
            ("Root Endpoint", self.test_root_endpoint),
            ("Create Deliveries", self.test_create_deliveries),
            ("Get Driver Deliveries", self.test_get_driver_deliveries),
            ("Update Delivery Status", self.test_update_delivery_status),
            ("Send Messages", self.test_send_messages),
            ("Get Driver Messages", self.test_get_driver_messages),
            ("Get Conversation", self.test_get_conversation),
            ("Get Active Customers", self.test_get_active_customers),
            ("Error Handling", self.test_error_handling)
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            print(f"Running: {test_name}")
            print("-" * 40)
            if test_func():
                passed += 1
            print()
        
        # Summary
        print("=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        print()
        
        # Detailed results
        print("DETAILED RESULTS:")
        print("-" * 30)
        for result in self.test_results:
            status = "✅" if result['success'] else "❌"
            print(f"{status} {result['test']}")
            if result['details']:
                print(f"   {result['details']}")
        
        return passed == total

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 All tests passed! Backend API is working correctly.")
    else:
        print("\n⚠️  Some tests failed. Check the details above.")