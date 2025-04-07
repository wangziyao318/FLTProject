import Header from "./components/Header"
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import Homepage from "./pages/Homepage"
import UserProfile from "./pages/UserProfile"
import CreateProject from "./pages/CreateProject"
import ProjectDetails from "./pages/ProjectDetails"
import Project from "./pages/Project"
import { projectPath, createProjectPath, rootPath, userProfilePath, governancePath} from "./components/RouteConstants"
import { useEffect } from 'react'
import { setGlobalState, useGlobalState } from './utils/globalState';
import TransactionArtifact from './artifacts/contracts/Transaction.sol/Transaction.json'
import FLTArtifact from './artifacts/contracts/FLT.sol/FLT.json'
import { ethers } from 'ethers'
import { getProjects, getFLTBalance } from "./utils/contractServices"

//export const transactionContractAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
//export const fltContractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const transactionContractAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
export const fltContractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

function App() {
  const [account] = useGlobalState("account")
  const transactionAbi = TransactionArtifact.abi
  const fltAbi = FLTArtifact.abi
  const provider = new ethers.BrowserProvider(window.ethereum)
  const transactionContract = new ethers.Contract(transactionContractAddress, transactionAbi, provider)
  const fltContract = new ethers.Contract(fltContractAddress, fltAbi, provider)

  // listen to the wallet connection
  useEffect(() => {
    if (!window.ethereum) {
      alert("No Ethereum browser extension detected. Please install MetaMask extension.")
      return;
    } 

    const accountChanged = async (result: string[]) => {
      setGlobalState("account", result[0]);
      console.log("Account was changed");
      if (result && result.length > 0) {
        setGlobalState("active", true);
        
        // Update balances when account changes
        try {
          await getFLTBalance(result[0]);
        } catch (error) {
          console.error("Error updating FLT balance:", error);
        }
      } else {
        setGlobalState("active", false);
        // Reset token balances when disconnected
        setGlobalState("creatorTokenBalance", "0");
        setGlobalState("fanTokenBalance", "0");
        setGlobalState("isBlacklisted", false);
      }
    }

    const connect = async() => {
      const result = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setGlobalState("account", result[0]);
      console.log("Account was connected");
      
      // Update FLT balances when connected
      if (result && result.length > 0) {
        try {
          await getFLTBalance(result[0]);
        } catch (error) {
          console.error("Error updating FLT balance:", error);
        }
      }
    }

    const disconnect = () => {
      setGlobalState("account", "");
      setGlobalState("creatorTokenBalance", "0");
      setGlobalState("fanTokenBalance", "0");
      setGlobalState("isBlacklisted", false);
      console.log("Account was disconnected");
    }

    window.ethereum.on('accountsChanged', accountChanged);
    window.ethereum.on('connect', connect);
    window.ethereum.on('disconnect', disconnect);

    return () => {
      window.ethereum.off('accountsChanged', accountChanged);
      window.ethereum.off('connect', connect);
      window.ethereum.off('disconnect', disconnect);
    }
  }, [account])

  // Listen to the ProjectCreated event
  useEffect(() => {
    if (!window.ethereum) {
      alert("No Ethereum browser extension detected. Please install MetaMask extension.")
      return;
    }
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    const transactionContract = new ethers.Contract(transactionContractAddress, transactionAbi, provider);

    const listenToEvent = async() => {
      try {
        transactionContract.on('ProjectCreated', async (projectId, creator) => {
          await getProjects();
          console.log('ProjectCreated!', projectId, creator);
          
          // Update creator's FLT balance since they may receive tokens
          if (creator.toLowerCase() === account?.toLowerCase()) {
            await getFLTBalance(account);
          }
        });
      } catch (e) {
        console.log(e);
      }
    }

    listenToEvent();

    return () => {
      transactionContract.removeAllListeners('ProjectCreated');
    }
  }, [account]);

  // Listen to the ProjectCancelled event
  useEffect(() => {
    if (!window.ethereum) {
      alert("No Ethereum browser extension detected. Please install MetaMask extension.")
      return;
    }
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    const transactionContract = new ethers.Contract(transactionContractAddress, transactionAbi, provider);

    const listenToEvent = async() => {
      try {
        transactionContract.on('ProjectCancelled', async (projectId, creator) => {
          await getProjects();
          console.log('ProjectCancelled!', projectId, creator);
          
          // Update creator's FLT balance since they may lose tokens as penalty
          if (creator.toLowerCase() === account?.toLowerCase()) {
            await getFLTBalance(account);
          }
        });
      } catch (e) {
        console.log(e);
      }
    }

    listenToEvent();

    return () => {
      transactionContract.removeAllListeners('ProjectCancelled');
    }
  }, [account]);

  // Listen to the MilestoneReleased event
  useEffect(() => {
    if (!window.ethereum) {
      alert("No Ethereum browser extension detected. Please install MetaMask extension.")
      return;
    }
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    const transactionContract = new ethers.Contract(transactionContractAddress, transactionAbi, provider);

    const listenToEvent = async() => {
      try {
        transactionContract.on('MilestoneReleased', async (projectId, milestoneIndex, amountReleased) => {
          await getProjects();
          console.log('MilestoneReleased!', projectId, milestoneIndex, amountReleased);
          
          // Update FLT balances since creator receives tokens
          if (account) {
            await getFLTBalance(account);
          }
        });
      } catch (e) {
        console.log(e);
      }
    }

    listenToEvent();

    return () => {
      transactionContract.removeAllListeners('MilestoneReleased');
    }
  }, [account]);

   // Listen to FLT token minting/burning events
   useEffect(() => {
    if (!window.ethereum) {
      alert("No Ethereum browser extension detected. Please install MetaMask extension.")
      return;
    }
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    const fltContract = new ethers.Contract(fltContractAddress, fltAbi, provider);

    const listenToFLTEvents = async() => {
      try {
        // Listen for TransferSingle events (which occur on minting/burning)
        fltContract.on('TransferSingle', async (operator, from, to, id, value) => {
          console.log('FLT Token Transfer!', {operator, from, to, id, value});
          
          // Update FLT balance if current user is involved
          if (account && 
             (account.toLowerCase() === from.toLowerCase() || 
              account.toLowerCase() === to.toLowerCase())) {
            await getFLTBalance(account);
          }
        });
      } catch (e) {
        console.log(e);
      }
    }
    
    listenToFLTEvents();
    
    return () => {
      fltContract.removeAllListeners('TransferSingle');
    }
  }, [account]);

  // useEffect(() => {
  //   if (!window.ethereum || !transactionContract) {
  //     if (!window.ethereum) {
  //       alert("No Ethereum browser extension detected. Please install MetaMask extension.")
  //     }
  //     return;
  //   } 
  
  //   const handleWithdrawal = async () => {
  //     try {
  //       await getProjects();
  //       console.log('Withdrawal event processed');
  //     } catch (error) {
  //       console.error('Error handling Withdrawal:', error);
  //     }
  //   };
  
  //   // Remove the old listeners that may exist first.
  //   transactionContract.off('Withdrawal', handleWithdrawal);
    
  //   // Add a new listener
  //   transactionContract.on('Withdrawal', handleWithdrawal);
  
  //   return () => {
  //     // Ensure the same callback reference is used during cleanup
  //     transactionContract.off('Withdrawal', handleWithdrawal);
  //   };
  // }, [transactionContract]); // AddtransactionContract作为依赖

  const BlacklistedNotification = () => {
    const [isBlacklisted] = useGlobalState("isBlacklisted");
    
    if (!isBlacklisted) return null;
    
    return (
      <div className="fixed top-16 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded shadow-md z-50">
        <strong>Account Blacklisted</strong>
        <p className="text-sm">Your account has restrictions</p>
      </div>
    );
  };

  return (
    <Router>
      <>
        <div className="min-h-screen">
          <Header/>
          <Routes>
            <Route path={rootPath} element={<Homepage/>}/>
            <Route path={userProfilePath} element={<UserProfile/>}/>
            <Route path={createProjectPath} element={<CreateProject/>}/>
            <Route path={projectPath} element={<Project/>}/>
          </Routes>
        </div>
      </>
    </Router>
  );
}

export default App;