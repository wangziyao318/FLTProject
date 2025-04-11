import { Link } from 'react-router-dom'
import { connectWallet } from '../utils/contractServices'
import ButtonVariant from './ButtonVariant'
import ProfileButton from './ProfileButton'
import CreateProjectButton from './CreateProjectButton'
import { useGlobalState } from '../utils/globalState'
import { formatAddress } from '../utils/helpers'
import { fanProjectsPath } from './RouteConstants' // 导入fanProjectsPath

const Header = () => {
  const [account] = useGlobalState('account')
  const [fltBalance] = useGlobalState('fltBalance')
  const [isOwner] = useGlobalState('isOwner')

  return (
    <header className="flex justify-between items-center p-5 bg-white shadow-lg fixed top-0 left-0 right-0 z-10">
      <Link to="/" className="flex justify-start ml-20 items-center text-3xl text-black font-black">
        <span>Home Page</span>
      </Link>
      
      <div className="flex space-x-4">
        {/* 添加Fan Projects链接 */}
        <Link 
          to={fanProjectsPath} 
          className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
        >
          Fan Projects
        </Link>
        
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
            <CreateProjectButton style="bg-gray-600 hover:bg-gray-700" disabled={false} />
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