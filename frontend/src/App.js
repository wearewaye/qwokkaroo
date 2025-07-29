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
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'chat', 'deliveries'
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
      text: 'Hi! Just checking on my Chinese order. How far away are you?',
      sender: 'customer',
      timestamp: new Date(Date.now() - 5 * 60000)
    },
    {
      id: '2',
      customer_name: 'Sarah Johnson',
      text: 'Hi Sarah! I\'m about 5 minutes away from your Gerrard Street address. Your food is hot and ready!',
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
      case 'in_progress': return 'bg-purple-100 text-purple-800';
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

  const getUnreadCount = (customerName) => {
    const customerMessages = getCustomerMessages(customerName);
    return customerMessages.filter(msg => msg.sender === 'customer').length;
  };

  // Mobile Dashboard View
  const DashboardView = () => (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-purple-600 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <span className="text-purple-600 font-bold text-xl">🚗</span>
            </div>
            <div>
              <h1 className="text-lg font-bold">John Smith</h1>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm opacity-90">Online</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-90">Today</p>
            <p className="text-xl font-bold">£89.50</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white mx-4 -mt-6 rounded-xl shadow-lg p-4 mb-4 relative z-10">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-purple-600">{deliveries.filter(d => d.status !== 'delivered').length}</p>
            <p className="text-xs text-gray-600">Active</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">8</p>
            <p className="text-xs text-gray-600">Completed</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">23.1</p>
            <p className="text-xs text-gray-600">km Today</p>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="mx-4 mb-4">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="h-80">
            <MapContainer 
              center={[driverLocation.lat, driverLocation.lng]} 
              zoom={14} 
              className="h-full w-full rounded-xl"
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
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mx-4 space-y-3">
        <button
          onClick={() => setCurrentView('deliveries')}
          className="w-full bg-white rounded-xl shadow-lg p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📦</span>
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">Active Deliveries</h3>
              <p className="text-sm text-gray-600">{deliveries.filter(d => d.status !== 'delivered').length} pending orders</p>
            </div>
          </div>
          <div className="text-gray-400">→</div>
        </button>

        <button
          onClick={() => setCurrentView('chat')}
          className="w-full bg-white rounded-xl shadow-lg p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center relative">
              <span className="text-2xl">💬</span>
              {getUnreadCount(activeCustomer) > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">{getUnreadCount(activeCustomer)}</span>
                </div>
              )}
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">Messages</h3>
              <p className="text-sm text-gray-600">Chat with customers</p>
            </div>
          </div>
          <div className="text-gray-400">→</div>
        </button>
      </div>

      {/* Quick Customer List */}
      <div className="mx-4 mt-4 bg-white rounded-xl shadow-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Recent Customers</h3>
        <div className="space-y-2">
          {deliveries.slice(0, 2).map((delivery) => (
            <div 
              key={delivery.id}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
              onClick={() => {
                setActiveCustomer(delivery.customer_name);
                setCurrentView('chat');
              }}
            >
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-bold">{delivery.customer_name[0]}</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{delivery.customer_name}</p>
                <p className="text-sm text-gray-600">{delivery.address.split(',')[0]}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}>
                {getStatusIcon(delivery.status)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-20"></div> {/* Bottom spacing */}
    </div>
  );

  // Mobile Chat View
  const ChatView = () => (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Chat Header */}
      <div className="bg-purple-600 text-white p-4 shadow-lg">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setCurrentView('dashboard')}
            className="text-white hover:bg-purple-700 p-2 rounded-lg"
          >
            ←
          </button>
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <span className="text-purple-600 font-bold">{activeCustomer[0]}</span>
          </div>
          <div>
            <h2 className="font-semibold">{activeCustomer}</h2>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm opacity-90">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Info Card */}
      <div className="bg-white mx-4 mt-4 rounded-xl shadow-lg p-4">
        {deliveries
          .filter(d => d.customer_name === activeCustomer)
          .map(delivery => (
            <div key={delivery.id}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">Current Order</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}>
                  {getStatusIcon(delivery.status)} {delivery.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{delivery.address}</p>
              <p className="text-sm text-gray-600 mb-2">{delivery.customer_phone}</p>
              <div className="border-t pt-2 mt-2">
                <p className="text-xs font-medium text-gray-700">Order Details:</p>
                <p className="text-sm text-gray-900">{delivery.order_details}</p>
              </div>
            </div>
          ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {getCustomerMessages(activeCustomer).map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'driver' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-4 py-3 rounded-2xl ${
                message.sender === 'driver'
                  ? 'bg-purple-500 text-white'
                  : 'bg-white text-gray-900 shadow-lg'
              }`}
            >
              <p className="text-sm">{message.text}</p>
              <p className={`text-xs mt-2 ${
                message.sender === 'driver' ? 'text-purple-200' : 'text-gray-500'
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
      <div className="bg-white border-t p-4">
        <div className="flex space-x-3 items-end">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base"
          />
          <button
            onClick={sendMessage}
            className="px-6 py-3 bg-purple-500 text-white rounded-2xl hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors font-medium"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );

  // Mobile Deliveries View
  const DeliveriesView = () => (
    <div className="min-h-screen bg-gray-50">
      {/* Deliveries Header */}
      <div className="bg-purple-600 text-white p-4 shadow-lg">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setCurrentView('dashboard')}
            className="text-white hover:bg-purple-700 p-2 rounded-lg"
          >
            ←
          </button>
          <div>
            <h2 className="text-lg font-bold">Active Deliveries</h2>
            <p className="text-sm opacity-90">{deliveries.filter(d => d.status !== 'delivered').length} orders pending</p>
          </div>
        </div>
      </div>

      {/* Deliveries List */}
      <div className="p-4 space-y-4">
        {deliveries.map((delivery) => (
          <div key={delivery.id} className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-bold">{delivery.customer_name[0]}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{delivery.customer_name}</h3>
                  <p className="text-sm text-gray-600">{delivery.customer_phone}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}>
                {getStatusIcon(delivery.status)} {delivery.status.replace('_', ' ')}
              </span>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-gray-600">📍 {delivery.address}</p>
              <div className="border-t pt-2">
                <p className="text-xs font-medium text-gray-700 mb-1">Order:</p>
                <p className="text-sm text-gray-900">{delivery.order_details}</p>
              </div>
            </div>

            <div className="flex space-x-2 mt-4">
              <button
                onClick={() => {
                  setActiveCustomer(delivery.customer_name);
                  setCurrentView('chat');
                }}
                className="flex-1 bg-purple-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-600 transition-colors"
              >
                💬 Message
              </button>
              <button className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-600 transition-colors">
                🗺️ Navigate
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Render current view
  const renderCurrentView = () => {
    switch (currentView) {
      case 'chat':
        return <ChatView />;
      case 'deliveries':
        return <DeliveriesView />;
      default:
        return <DashboardView />;
    }
  };

  return renderCurrentView();
};

function App() {
  return (
    <div className="App">
      <DriverDashboard />
    </div>
  );
}

export default App;