import { Link } from 'react-router-dom'
import { connectWallet } from '../utils/contractServices'
import ButtonVariant from './ButtonVariant'
import ProfileButton from './ProfileButton'
import FanProjectButton from './FanProjectButton'
import CreateProjectButton from './CreateProjectButton'
import { useGlobalState } from '../utils/globalState'

const Header = () => {
  const [account] = useGlobalState('account')
  const [fltBalance] = useGlobalState('fltBalance')
  const [isOwner] = useGlobalState('isOwner')

  return (
    <header className="flex justify-between items-center p-5 bg-gray-800 shadow-lg fixed top-0 left-0 right-0 z-10">
      <Link to="/" className="header-link">
        <span>Home Page</span>
      </Link>
      
      <div className="flex items-center space-x-4"> 


        {account && (
          <div className="flex items-center mr-4">
            <span className="text-sm text-gray-300 mr-2">FLT Balance:</span>
            <span className="bg-gray-700 text-white px-3 py-1 rounded-full text-sm font-bold">
              {parseFloat(fltBalance).toFixed(2)} FLT
            </span>
          </div>
        )}
        
        {isOwner && (
          <Link 
            to="/governance" 
            className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 transition-colors font-medium"
          >
            Governance
          </Link>
        )}
        
        {account ? (
          <>
            <FanProjectButton 
              style="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md font-medium transition-colors" 
              disabled={false} />
            <CreateProjectButton 
              style="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md font-medium transition-colors" 
              disabled={false} 
            />
            <ProfileButton 
              style="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md font-medium transition-colors" 
              disabled={false} 
            />
          </>
        ) : (
          <ButtonVariant 
            type="button"
            text="Connect Wallet" 
            style="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
            clickHandler={connectWallet}
            disabled={false}
          />
        )}
      </div>
    </header>
  )
}

export default Header