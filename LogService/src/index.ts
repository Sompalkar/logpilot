
import axios from 'axios';

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';
const LOG_INTERVAL = parseInt(process.env.LOG_INTERVAL || '1000');
const USERNAME = process.env.USERNAME || 'loggen';
const PASSWORD = process.env.PASSWORD || 'password123';

// Authentication token (will be fetched on startup)
let AUTH_TOKEN = process.env.AUTH_TOKEN || null;

const LEVELS= ['INFO', 'INFO', 'INFO', 'WARN', 'ERROR'];



const SERVICES= [

    "auth-service",
    "payment-service",
    "cart-service",
    "inventory-service",
    "user-service",
    "order-service",
    "search-service",
    "notification-service",
    
]

const SERVICE_MESSAGES: Record<string, string[]> = {
    "auth-service": [
      "User login successful",
      "User login failed: invalid password",
      "JWT token expired",
      "Password reset requested",
    ],
    "payment-service": [
      "Payment processed successfully",
      "Payment declined: insufficient funds",
      "Payment gateway timeout",
      "Refund issued",
    ],
    "cart-service": [
      "Item added to cart",
      "Item removed from cart",
      "Cart checkout started",
      "Cart abandoned",
    ],
    "inventory-service": [
      "Stock level updated",
      "Out of stock error",
      "Warehouse sync delayed",
      "Inventory threshold warning",
    ],
    "user-service": [
      "User profile updated",
      "New user registered",
      "User deleted account",
      "2FA enabled",
    ],
    "order-service": [
      "Order placed successfully",
      "Order failed: invalid address",
      "Order shipped",
      "Order cancelled",
    ],
    "search-service": [
      "User searched for 'laptop'",
      "Slow search query detected",
      "Autocomplete suggestion served",
      "Empty search query",
    ],
    "notification-service": [
      "Email notification sent",
      "SMS delivery failed",
      "Push notification sent",
      "Webhook callback failed",
    ],
  };




function choice <T>(arr: T[]): T {
    if (arr.length === 0) {
        throw new Error('Cannot choose from empty array');
    }
    return arr[Math.floor(Math.random() * arr.length)]!;
}


function randomIP() {
    return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(
      Math.random() * 255
    )}.${Math.floor(Math.random() * 255)}`;
  }


  function generateLog (){

    const service = choice(SERVICES);
    const messages = SERVICE_MESSAGES[service];
    if (!messages) {
        throw new Error(`No messages found for service: ${service}`);
    }
    const message = choice(messages);
    const level = choice(LEVELS);


    return{
         orgId: `org-${Math.ceil(Math.random() * 5)}`, // Random org ID
         timestamp: new Date().toISOString(),
         level,
         service,
         message,
         latencyMs: Math.floor(Math.random() * 500),
         responseCode: [200,200,200,404,500][Math.floor(Math.random() *5)],
         metadata:{
            requestId: Math.random().toString(36).substring(7),
            userId: `user-${Math.ceil(Math.random() *100)}`,
            ip: randomIP(),
            host: `host-${Math.ceil(Math.random() * 3)}`,
            userAgent: 'LogGenerator/1.0',
            endpoint: `/api/${service.split('-')[0]}/${Math.random().toString(36).substring(7)}`
        }
    }




   
  }


// Authentication functions
async function authenticateUser(): Promise<string | null> {
  try {
    console.log('🔐 Attempting to authenticate user...');
    
    // First try to register the user (in case it doesn't exist)
    try {
      await axios.post(`${BACKEND_URL}/api/v1/auth/register`, {
        username: USERNAME,
        password: PASSWORD,
        role: 'admin'
      });
      console.log('✅ User registered successfully');
    } catch (regError: any) {
      if (regError.response?.status === 409) {
        console.log('ℹ️  User already exists, proceeding to login...');
      } else {
        console.log('⚠️  Registration failed:', regError.response?.data?.error || regError.message);
      }
    }

    // Login to get token
    const loginResponse = await axios.post(`${BACKEND_URL}/api/v1/auth/login`, {
      username: USERNAME,
      password: PASSWORD
    });

    const token = loginResponse.data.token;
    console.log('✅ Authentication successful');
    return token;
    
  } catch (error: any) {
    console.error('❌ Authentication failed:', error.response?.data?.error || error.message);
    return null;
  }
}

async function sendLogToBackend(log: any) {
  try {
    if (!AUTH_TOKEN) {
      console.log('⚠️  No auth token available, skipping log...');
      return;
    }

    await axios.post(`${BACKEND_URL}/api/v1/ingest`, log, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    // Log success occasionally to avoid spam
    if (Math.random() < 0.01) { // 1% of the time
      console.log('📤 Log sent successfully');
    }
        
  } catch (error: any) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log('🔐 Token expired or invalid, re-authenticating...');
      AUTH_TOKEN = await authenticateUser();
    } else {
      console.log("❌ Error sending log:", error.response?.data?.error || error.message);
    }
  }
}



function startLogGenerator(){
  console.log(`🚀 Starting log generator...`);
  console.log(`📊 Generating logs every ${LOG_INTERVAL}ms`);
  console.log(`🎯 Target backend: ${BACKEND_URL}`);

  setInterval(() => {
    const log = generateLog();
    
    // Log generated data occasionally to avoid spam
    if (Math.random() < 0.001) { // 0.1% of the time
      console.log("📝 Sample log generated:", JSON.stringify(log, null, 2));
    }

    sendLogToBackend(log);
  }, LOG_INTERVAL);
}

// Main startup function
async function main() {
  console.log('🔥 LogPilot Log Generator Starting...');
  
  // Wait a bit for backend to be ready if using Docker
  if (process.env.NODE_ENV === 'production') {
    console.log('⏳ Waiting for backend to be ready...');
    await new Promise(resolve => setTimeout(resolve, 10000));
  }

  // Authenticate
  if (!AUTH_TOKEN) {
    AUTH_TOKEN = await authenticateUser();
    if (!AUTH_TOKEN) {
      console.error('❌ Failed to authenticate. Exiting...');
      process.exit(1);
    }
  }

  // Start generating logs
  startLogGenerator();
  console.log('✅ Log generator is running!');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down log generator...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down log generator...');
  process.exit(0);
});

// Start the application
main().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});


