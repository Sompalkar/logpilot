
import axios from 'axios';

 

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




function choice <T>(arr: T[]):T{

     return arr[Math.floor(Math.random() * arr.length)];
}


function randomIP() {
    return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(
      Math.random() * 255
    )}.${Math.floor(Math.random() * 255)}`;
  }


  function generateLog (){

    const service = choice(SERVICES);
    const message = choice(SERVICE_MESSAGES[service]);
    const level = choice(LEVELS);


    return{

         timestamp: new Date().toISOString(),
         level,
         service,
         message,
         metadata:{

            requestID:Math.random().toString(36).substring(7),
            userId: `user-${Math.ceil(Math.random() *100)}`,
            ip: randomIP(),
            latencyMS: Math.floor(Math.random() * 500),
            responseCode: [200,200,200,404,500][Math.floor(Math.random() *5)],
            host:  `host-${Math.ceil(Math.random() * 3)}`,

        
        }
    }




   
  }


  async function sendLogTOBackend(log:any) {


    try {

        await axios.post("http://localhost:4000/ingest", log);

        
    } catch (error :any) {
        
        console.log("Error sending log: " ,error.message);

    }
    
}



function startLogGenerator(){

     setInterval(()=>{

        const log = generateLog();


        console.log("Log generated Locally", log)

     }, 1000);

     
}



startLogGenerator();


