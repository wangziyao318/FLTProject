import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import ButtonVariant from "../components/ButtonVariant";
import { ToastContainer } from 'react-toastify';
import { toastSuccess, toastError } from '../components/toastMsg';
import { useGlobalState } from '../utils/globalState';
import { contributeToProject, withdrawContribution, cancelProject } from "../utils/contractServices";
import { 
  getProjectStatus, 
  getMilestoneProgress, 
  canWithdraw, 
  canCancel, 
  formatAddress 
} from "../utils/helpers";
import { Project, Contribution } from "../types"; // Import your type definitions

// Define the interface for the component props
interface ProjectDetailsProps {
  project: Project;
  contributions?: Contribution[];
}

// Define the interface for the form values
interface ContributeValues {
  amount: string;
}

const ProjectDetails = ({ project, contributions = [] }: ProjectDetailsProps) => {
  const [account] = useGlobalState('account');
  
  // Find current user's contribution
  const userContribution = contributions?.find(
    (c: Contribution) => c.user.toLowerCase() === account?.toLowerCase()
  );
  
  const status = getProjectStatus(project);
  const milestoneProgress = getMilestoneProgress(project);
  const userCanWithdraw = canWithdraw(project, account);
  const userCanCancel = canCancel(project, account);
  
  const handleContribute = async (values: ContributeValues) => {
    if (project.campaignClosed || project.cancelled) {
      toastError("Project is not open for contributions!");
      return;
    }
    
    if (project.creator.toLowerCase() === account.toLowerCase()) {
      toastError("Creator cannot contribute to their own project!");
      return;
    }
    
    const [success, msg] = await contributeToProject(project.id, values.amount);
    if (success) {
      toastSuccess('Successfully contributed!');
    } else {
      toastError(`Failed to contribute: ${msg}`);
    }
  };
  
  const handleWithdraw = async () => {
    if (!userCanWithdraw) {
      toastError("Cannot withdraw at this time!");
      return;
    }
    
    const [success, msg] = await withdrawContribution(project.id);
    if (success) {
      toastSuccess('Successfully withdrew your contribution!');
    } else {
      toastError(`Failed to withdraw: ${msg}`);
    }
  };
  
  const handleCancel = async () => {
    if (!userCanCancel) {
      toastError("Cannot cancel project at this time!");
      return;
    }
    
    const [success, msg] = await cancelProject(project.id);
    if (success) {
      toastSuccess('Successfully cancelled the project!');
    } else {
      toastError(`Failed to cancel: ${msg}`);
    }
  };
  
  const validationSchema = Yup.object().shape({
    amount: Yup.number()
      .min(0.00001, 'Amount must be at least 0.00001 ETH')
      .required('Amount is required'),
  });
  
  return (
    <div className="min-h-full">
      <div className="min-h-[850px] flex justify-center sm:items-center">
        <div className="w-[1150px] h-auto flex flex-col sm:flex-row items-center bg-gray-100 rounded-xl relative"> 
          <div className="p2-2 text-center sm:text-left sm:w-[50%] flex flex-col m-5">
            {project.metadata?.imageUrl ? (
              <img
                src={project.metadata.imageUrl}
                alt={project.metadata?.title || "Project Image"}
                className="rounded-xl h-full w-full object-cover"
              />
            ) : (
              <div className="rounded-xl h-64 w-full bg-gray-300 flex items-center justify-center">
                <span className="text-gray-500">No Image</span>
              </div>
            )}
          </div>
          
          <div className="bg-white p2-2 rounded-xl text-left sm:w-[50%] flex flex-col m-5 shadow-lg">
            <div className="p-5">
              <div className="flex flex-col">
                <div className="flex flex-row justify-between">
                  <h3 className="text-2xl md:text-6xl lg:text-3xl font-bold tracking-tight mb-1">
                    {project.metadata?.title || `Project #${project.id}`}
                  </h3>
                  <span className={`text-sm font-bold px-3 py-1 rounded-full h-fit ${
                    status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                    status === 'FUNDED' ? 'bg-blue-100 text-blue-800' :
                    status === 'SUCCESSFUL' ? 'bg-purple-100 text-purple-800' :
                    status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {status}
                  </span>
                </div>
                
                <div className="flex justify-between items-center w-full pt-3">
                  <div className="flex justify-start space-x-4">
                    <div>
                      <span className="text-xs text-gray-500">Creator</span>
                      <p className="text-sm font-medium">{formatAddress(project.creator)}</p>
                    </div>
                    
                    <div>
                      <span className="text-xs text-gray-500">Contributors</span>
                      <p className="text-sm font-medium">{contributions?.length || 0}</p>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm tracking-tight my-4 text-gray-800">
                  {project.metadata?.description || "No description available"}
                </p>
              </div>
              
              <div className="flex flex-col space-y-4 mt-4">
                <div>
                  <h4 className="font-bold text-gray-800 mb-2">Funding Progress</h4>
                  <div className="w-full bg-gray-300 overflow-hidden">
                    <div
                      className="bg-gray-700 text-center p-0.5 rounded-l-full"
                      style={{ width: `${(parseFloat(project.fundsCollected) / parseFloat(project.targetAmount)) * 100}%` }}
                    >
                    </div>
                  </div>
                  <div className="flex justify-between items-center font-bold mt-1 mb-4 text-gray-700">
                    <small>{project.fundsCollected} ETH Raised</small>
                    <small className='flex justify-start items-center'>Goal: {project.targetAmount} ETH</small>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-bold text-gray-800 mb-2">Milestone Progress</h4>
                  <div className="w-full bg-gray-300 overflow-hidden">
                    <div
                      className="bg-gray-700 text-center p-0.5 rounded-l-full"
                      style={{ width: `${milestoneProgress}%` }}
                    >
                    </div>
                  </div>
                  <div className="flex justify-between items-center font-bold mt-1 mb-4 text-gray-700">
                    <small>{project.approvedMilestones} / {project.totalMilestones} Milestones Completed</small>
                    <small className='flex justify-start items-center'>
                      {project.releasedFunds} ETH Released
                    </small>
                  </div>
                </div>
                
                {!project.campaignClosed && !project.cancelled && (
                  <div className="mt-4">
                    <h4 className="font-bold text-gray-800 mb-2">Contribute to this project</h4>
                    <Formik 
                      initialValues={{ amount: "" }}
                      onSubmit={handleContribute}
                      validationSchema={validationSchema}
                    >
                      <Form>
                        <div className="flex flex-row mt-2">
                          <Field 
                            type="number" 
                            name="amount" 
                            step="0.01" 
                            placeholder="Amount in ETH" 
                            className="input rounded-md outline outline-offset-2 outline-1 p-2" 
                          />
                          
                          <ButtonVariant 
                            type="submit"
                            text="Contribute"
                            style="bg-gray-600 hover:bg-gray-700 ml-4"
                            disabled={false}
                            clickHandler={() => {}} // Form handles submission
                          />
                        </div>
                        
                        <ErrorMessage name="amount" component="div" className="text-xs text-red-700 mt-1" />
                      </Form>
                    </Formik>
                  </div>
                )}
                
                {userContribution && (
                  <div className="mt-2 p-4 bg-gray-100 rounded-lg">
                    <h4 className="font-bold text-gray-800 mb-2">Your Contribution</h4>
                    <p className="text-sm">You've contributed <span className="font-bold">{userContribution.amount} ETH</span> to this project.</p>
                    
                    {userCanWithdraw && (
                      <div className="mt-3">
                        <ButtonVariant 
                          type="button"
                          text="Withdraw Contribution"
                          style="bg-yellow-600 hover:bg-yellow-700"
                          disabled={false}
                          clickHandler={handleWithdraw}
                        />
                        <p className="text-xs text-red-700 mt-1">
                          Warning: Withdrawing will incur a penalty of 1 FLT token.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {project.creator.toLowerCase() === account?.toLowerCase() && userCanCancel && (
            <div className="bottom-6 right-6 absolute">
              <ButtonVariant 
                type="button"
                text="Cancel Project"
                style="bg-red-600 hover:bg-red-700"
                disabled={false}
                clickHandler={handleCancel}
              />
              <p className="text-xs text-red-700 mt-1">
                Warning: Cancelling will incur a penalty of 5 FLT tokens.
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div className="w-[1150px] mx-auto rounded-xl mt-8 mb-16">
        <h3 className="text-xl font-bold mb-3">Contributors:</h3>
        {contributions?.length > 0 ? (
          <div className="bg-white p-4 rounded-lg shadow">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Address</th>
                  <th className="text-right py-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {contributions.map((contribution: Contribution, index: number) => (
                  <tr key={index} className="border-b">
                    <td className="py-3">{formatAddress(contribution.user)}</td>
                    <td className="text-right py-3 font-bold">{contribution.amount} ETH</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600">No one has contributed yet!</p>
        )}
      </div>
      
      <ToastContainer 
        className="text-lg text-gray-600 text-center font-bold"
        style={{ height: '100px', width: '300px' }}
      />
    </div>  
  )
}

export default ProjectDetails;