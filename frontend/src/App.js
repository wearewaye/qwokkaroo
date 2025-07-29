import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DriverDashboard = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeCustomer, setActiveCustomer] = useState('Sarah Johnson');
  const [customers, setCustomers] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [driverLocation] = useState({ lat: 51.5118, lng: -0.1300 }); // London Chinatown
  
  const driverId = 'driver_001'; // Mock driver ID

  // Mock data for demo - London Chinatown area
  const mockDeliveries = [
    {
      id: '1',
      customer_name: 'Sarah Johnson',
      customer_phone: '+44 20 7946 0958',
      address: '15 Gerrard Street, Chinatown, London W1D 6JD',
      latitude: 51.5108,
      longitude: -0.1320,
      status: 'in_progress',
      order_details: '2x Sweet & Sour Pork, 1x Fried Rice, 1x Prawn Crackers'
    },
    {
      id: '2',
      customer_name: 'Mike Chen',
      customer_phone: '+44 20 7946 0123',
      address: '8 Little Newport Street, Chinatown, London WC2H 7JJ',
      latitude: 51.5128,
      longitude: -0.1280,
      status: 'pending',
      order_details: '3x Dim Sum Selection, 2x Jasmine Tea, 1x Fortune Cookies'
    },
    {
      id: '3',
      customer_name: 'Emily Davis',
      customer_phone: '+44 20 7946 0789',
      address: '25 Lisle Street, Chinatown, London WC2H 7BA',
      latitude: 51.5098,
      longitude: -0.1310,
      status: 'pending',
      order_details: '1x Peking Duck, 1x Pancakes, 1x Hoisin Sauce'
    }
  ];

  const mockMessages = [
    {
      id: '1',
      customer_name: 'Sarah Johnson',
      text: 'Hi! Just checking on my pizza order. How far away are you?',
      sender: 'customer',
      timestamp: new Date(Date.now() - 5 * 60000)
    },
    {
      id: '2',
      customer_name: 'Sarah Johnson',
      text: 'Hi Sarah! I\'m about 5 minutes away. Your order is ready and hot!',
      sender: 'driver',
      timestamp: new Date(Date.now() - 3 * 60000)
    },
    {
      id: '3',
      customer_name: 'Sarah Johnson',
      text: 'Perfect! I\'ll be waiting by the front door.',
      sender: 'customer',
      timestamp: new Date(Date.now() - 1 * 60000)
    }
  ];

  useEffect(() => {
    // Initialize with mock data
    setDeliveries(mockDeliveries);
    setMessages(mockMessages);
    setCustomers(mockDeliveries.map(d => d.customer_name));
  }, []);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageData = {
      driver_id: driverId,
      customer_name: activeCustomer,
      text: newMessage,
      sender: 'driver'
    };

    try {
      // For demo purposes, just add to local state
      const newMsg = {
        ...messageData,
        id: Date.now().toString(),
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const getCustomerMessages = (customerName) => {
    return messages.filter(msg => msg.customer_name === customerName);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'in_progress': return '🚗';
      case 'delivered': return '✅';
      default: return '📦';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">🚗</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Driver Dashboard</h1>
                  <p className="text-sm text-gray-600">John Smith • Online</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-800">Online</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Today's Earnings</p>
                <p className="text-lg font-bold text-green-600">$127.50</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Panel - Deliveries & Chat */}
        <div className="w-1/3 bg-white border-r flex flex-col">
          {/* Active Deliveries */}
          <div className="border-b p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Active Deliveries</h2>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {deliveries.map((delivery) => (
                <div 
                  key={delivery.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                    activeCustomer === delivery.customer_name 
                      ? 'border-purple-300 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveCustomer(delivery.customer_name)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{delivery.customer_name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}>
                      {getStatusIcon(delivery.status)} {delivery.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{delivery.address}</p>
                  <p className="text-xs text-gray-500">{delivery.order_details}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Section */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-900">Chat with {activeCustomer}</h3>
              <div className="flex items-center mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Online</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {getCustomerMessages(activeCustomer).map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'driver' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-2xl ${
                      message.sender === 'driver'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === 'driver' ? 'text-orange-200' : 'text-gray-500'
                    }`}>
                      {new Date(message.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <button
                  onClick={sendMessage}
                  className="px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Map */}
        <div className="flex-1 relative">
          <MapContainer 
            center={[driverLocation.lat, driverLocation.lng]} 
            zoom={13} 
            className="h-full w-full"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {/* Driver Location */}
            <Marker position={[driverLocation.lat, driverLocation.lng]}>
              <Popup>
                <div className="text-center">
                  <strong>🚗 Your Location</strong>
                  <br />
                  Driver: John Smith
                </div>
              </Popup>
            </Marker>

            {/* Delivery Locations */}
            {deliveries.map((delivery) => (
              <Marker 
                key={delivery.id} 
                position={[delivery.latitude, delivery.longitude]}
              >
                <Popup>
                  <div className="min-w-48">
                    <div className="flex items-center justify-between mb-2">
                      <strong>{delivery.customer_name}</strong>
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(delivery.status)}`}>
                        {delivery.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{delivery.address}</p>
                    <p className="text-sm text-gray-600 mb-2">{delivery.customer_phone}</p>
                    <div className="border-t pt-2">
                      <p className="text-xs font-medium text-gray-700">Order:</p>
                      <p className="text-xs text-gray-600">{delivery.order_details}</p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Map Overlay - Quick Stats */}
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 z-1000">
            <h4 className="font-semibold text-gray-900 mb-2">Quick Stats</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Active Deliveries:</span>
                <span className="font-medium">{deliveries.filter(d => d.status !== 'delivered').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Completed Today:</span>
                <span className="font-medium">8</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Distance Traveled:</span>
                <span className="font-medium">47.2 km</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <DriverDashboard />
    </div>
  );
}

export default App;