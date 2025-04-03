import { useEffect } from 'react';
import Slogan from '../components/Slogan';
import AllProjects from "../components/AllProjects";
import { useGlobalState } from '../utils/globalState';
import { getProjects } from '../utils/contractServices';
import './Homepage.css'; // Newly added CSS files

const Homepage = () => {
  const [projects] = useGlobalState("allProjects");
  const [account] = useGlobalState("account");
  
  useEffect(() => {
    async function fetchData() {
      await getProjects();
    }
    fetchData();
  }, []);
  
  return (
    <div className="homepage-container">
      <Slogan 
        text1="Fund The Future" 
        text2="Empowering Creators with Milestone-Based Funding"
      />
      
      <AllProjects projects={projects}/>
    </div>
  );
}

export default Homepage;