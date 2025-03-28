import { Link } from 'react-router-dom'
import { connectWallet } from '../utils/contractServices'
import ButtonVariant from './ButtonVariant'
import ProfileButton from './ProfileButton'
import AddProjectButton from './AddProjectButton'
import { useGlobalState } from '../utils/globalState'
import { formatAddress } from '../utils/helpers'

const Header = () => {
  const [account] = useGlobalState('account')
  const [fltBalance] = useGlobalState('fltBalance')
  const [isOwner] = useGlobalState('isOwner')

  return (
    <header className="flex justify-between items-center p-5 bg-white shadow-lg fixed top-0 left-0 right-0 z-10">
      <Link to="/" className="flex justify-start ml-20 items-center text-3xl text-black font-black">
        <span>Flock Studios</span>
      </Link>
      
      <div className="flex space-x-4">
        {account && (
          <div className="flex items-center mr-4">
            <span className="text-sm font-medium mr-2">FLT Balance:</span>
            <span className="bg-gray-100 px-3 py-1 rounded-full text-sm font-bold">
              {parseFloat(fltBalance).toFixed(2)} FLT
            </span>
            </div>
        )}
        
        {isOwner && (
          <Link to="/governance" className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 transition-colors">
            Governance
          </Link>
        )}
        
        {account ? (
          <div className="flex items-center space-x-4">
            <AddProjectButton style="bg-gray-600 hover:bg-gray-700" disabled={false} />
            <ProfileButton style="bg-gray-600 hover:bg-gray-700" disabled={false} />
          </div>
        ) : (
          <ButtonVariant 
            type="button"
            text="Connect Wallet" 
            style="bg-blue-500 hover:bg-blue-600"
            clickHandler={connectWallet}
            disabled={false}
          />
        )}
      </div>
    </header>
  )
}

export default Header