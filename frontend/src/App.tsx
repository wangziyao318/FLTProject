import Header from "./components/Header"
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import Homepage from "./pages/Homepage"
import UserProfile from "./pages/UserProfile"
import CreateProject from "./pages/CreateProject"
import Project from "./pages/Project"
import { projectPath, createProjectPath, rootPath, userProfilePath, governancePath } from "./components/RouteConstants"
import { useEffect } from 'react'
import { setGlobalState, useGlobalState } from './utils/globalState';
import TransactionArtifact from './artifacts/contracts/Transaction.sol/Transaction.json'
import FLTArtifact from './artifacts/contracts/FLT.sol/FLT.json'
import { ethers } from 'ethers'
import { getProjects } from "./utils/contractServices"
import Governance from "./pages/Governance"

//export const transactionContractAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
//export const fltContractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

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

    const accountChanged = (result: string[]) => {
      setGlobalState("account", result[0])
      console.log("Account was changed");
      if (result) {
        setGlobalState("active", true);
      } else {
        setGlobalState("active", false);
      }
    }

    const connect = async() => {
      const result = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setGlobalState("account", result[0])
      console.log("Account was connected");
    }

    const disconnect = () => {
      setGlobalState("account", "")
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

  // listen to the ProjectCreated event
  useEffect(() => {
    if (!window.ethereum) {
      alert("No Ethereum browser extension detected. Please install MetaMask extension.")
      return;
    } 

    const listenToEvent = async() => {
      try {
        transactionContract.on('ProjectCreated', async () => {
          await getProjects();
          console.log('ProjectCreated!')
        });
      } catch (e) {
        console.log(e);
      }
    }

    listenToEvent();

    return () => {
      transactionContract.removeAllListeners('ProjectCreated');
    }
  }, []);

  // listen to the ContributionReceived event
  useEffect(() => {
    if (!window.ethereum) {
      alert("No Ethereum browser extension detected. Please install MetaMask extension.")
      return;
    } 
    
    const listenToEvent = async() => {
      try {
        transactionContract.on('ContributionReceived', async () => {
          await getProjects();
          console.log('ContributionReceived!')
        })  
      } catch (e) {
        console.log(e);
      }
    }

    listenToEvent();

    return () => {
      transactionContract.removeAllListeners('ContributionReceived');
    }
  }, [])

  // listen to the MilestoneReleased event
  useEffect(() => {
    if (!window.ethereum) {
      alert("No Ethereum browser extension detected. Please install MetaMask extension.")
      return;
    } 
    
    const listenToEvent = async() => {
      try {
        transactionContract.on('MilestoneReleased', async () => {
          await getProjects();
          console.log('MilestoneReleased!')
        })  
      } catch (e) {
        console.log(e);
      }
    }

    listenToEvent();

    return () => {
      transactionContract.removeAllListeners('MilestoneReleased');
    }
  }, [])

  // listen to the Withdrawal event
  useEffect(() => {
    if (!window.ethereum) {
      alert("No Ethereum browser extension detected. Please install MetaMask extension.")
      return;
    } 
    
    const listenToEvent = async() => {
      try {
        transactionContract.on('Withdrawal', async () => {
          await getProjects();
          console.log('Withdrawal!')
        })  
      } catch (e) {
        console.log(e);
      }
    }

    listenToEvent();

    return () => {
      transactionContract.removeAllListeners('Withdrawal');
    }
  }, [])

  // listen to the ProjectCancelled event
  useEffect(() => {
    if (!window.ethereum) {
      alert("No Ethereum browser extension detected. Please install MetaMask extension.")
      return;
    } 
    
    const listenToEvent = async() => {
      try {
        transactionContract.on('ProjectCancelled', async () => {
          await getProjects();
          console.log('ProjectCancelled!')
        })  
      } catch (e) {
        console.log(e);
      }
    }

    listenToEvent();

    return () => {
      transactionContract.removeAllListeners('ProjectCancelled');
    }
  }, [])

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
            <Route path={governancePath} element={<Governance/>}/>
          </Routes>
        </div>
      </>
    </Router>
  );
}

export const transactionContractAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
export const fltContractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
export default App;