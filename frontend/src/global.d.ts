// MetaMask injects window.ethereum property, but the react compiler doesn't know it unless specified here
declare global {
    interface Window {
      ethereum?: any;
    }
  }
  
  export {};
  