import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import ButtonVariant from "../components/ButtonVariant";
import { ToastContainer } from 'react-toastify';
import { toastSuccess, toastError } from '../components/toastMsg';
import { useGlobalState } from '../utils/globalState';
import { useNavigate } from "react-router";
import { releaseMilestone, cancelProject, submitMilestone } from "../utils/contractServices";
import { 
    getProjectStatus, 
    getMilestoneProgress, 
    canReleaseMilestone, 
    canCancel, 
    formatAddress 
} from "../utils/helpers";
import { Project, Contribution } from "../types"; // Import your type definitions
import '../pages/ProjectForm.css';

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
  const [isBlacklisted] = useGlobalState('isBlacklisted');
  const [isOwner] = useGlobalState('isOwner');
  
  const status = getProjectStatus(project);
  const milestoneProgress = getMilestoneProgress(project);
  const userCanCancel = canCancel(project, account) && !isBlacklisted;
  const userCanReleaseMilestone = canReleaseMilestone(project, true) && isOwner && !isBlacklisted;
  const userCanSubmitMilestone = project.creator.toLowerCase() === account.toLowerCase() 
  && !isBlacklisted 
  && project.status === "FUNDED" 
  && project.approvedMilestones < project.totalMilestones;

  // Add a function to get milestone status text
  const getMilestoneStatusText = (index: number) => {
    if (project.approvedMilestones > index) {
      return "Approved";
    }
    if (project.approvedMilestones === index) {
      if (project.status === "FUNDED") {
        return "Pending Submission";
      }
      return "Submitted";
    }
    return "Upcoming";
  };

  // Add a function to get milestone status class
  const getMilestoneStatusClass = (index: number) => {
    if (project.approvedMilestones > index) {
      return "text-green-600";
    }
    if (project.approvedMilestones === index) {
      if (project.status === "FUNDED") {
        return "text-yellow-600";
      }
      return "text-blue-600";
    }
    return "text-gray-600";
  };

  const handleMilestoneSubmit = async () => {
    if (isBlacklisted) {
      toastError("Your account has been blacklisted and cannot perform this action.");
      return;
    }
    
    if (!userCanSubmitMilestone) {
      toastError("Cannot submit milestone at this time!");
      return;
    }
    
    const milestoneMetadata = {
      title: `Milestone ${project.approvedMilestones + 1}`,
      description: `Completed milestone ${project.approvedMilestones + 1} for project "${project.title}"`,
      timestamp: new Date().toISOString()
    };
    
    const milestoneUri = `ipfs://QmMilestone${Buffer.from(JSON.stringify(milestoneMetadata)).toString('base64').substring(0, 10)}`;
    
    const [success, msg] = await submitMilestone(project.id, milestoneUri);
    if (success) {
      toastSuccess('Successfully submitted the milestone!');
    } else {
      toastError(`Failed to submit milestone: ${msg}`);
    }
  };

  const handleReleaseMilestone = async () => {
    if (!userCanReleaseMilestone) {
      toastError("Cannot release milestone at this time!");
      return;
    }
    
    const [success, msg] = await releaseMilestone(project.id);
    if (success) {
      toastSuccess('Successfully released milestone! Creator received funds and FLT tokens.');
    } else {
      toastError(`Failed to release: ${msg}`);
    }
  };

  const handleCancel = async () => {
    if (isBlacklisted) {
      toastError("Your account has been blacklisted and cannot perform this action.");
      return;
    }

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
  
  const blacklistedWarning = isBlacklisted ? (
    <div className="error-box mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
      <h3 className="font-bold">Account Blacklisted</h3>
      <p>Your account has been blacklisted. You cannot interact with projects.</p>
    </div>
  ) : null;

  return (
    <Formik
        initialValues={project}
        onSubmit={handleCancel}
        validationSchema={validationSchema}
    >
        {({ isSubmitting, errors, touched }) => (
            <div className="form-wrapper">
                <div className="project-form-container">
                    <Form>
                        <div className="form-header">
                            <h1>Project List</h1>
                        </div>
                        
                        {blacklistedWarning}

                        {/* Project Info */}
                        <div className="form-field">
                            <label>
                                <span className="field-label">Project Title: {project.metadata?.title}</span>
                                <span className="field-label">Project Description:</span>
                                <p className="milestone-note">
                                    {project.metadata?.description}
                                </p>
                                <span className="field-label">Project Status: {project.status}</span>
                                <span className="field-label">Project Creator: {project.creator}</span>
                            </label>
                        </div>

                        <div className="info-box">
                            <h4>Funding Information:</h4>
                            <ul>
                                <li>• Target Fund Amount: {project.targetAmount} </li>
                                <li>• Fund Collected: {project.fundsCollected} </li>                                
                                <li>• Released Funds: {project.releasedFunds} </li>
                                <li>• Total Milestones: {project.totalMilestones} </li>
                                <li>• Approved Milestones: {project.approvedMilestones} </li>
                            </ul>
                        </div>

                        {/* Add milestone status display */}
                        <div className="info-box">
                            <h4>Milestone Status:</h4>
                            <ul>
                                {Array.from({ length: project.totalMilestones }, (_, i) => (
                                    <li key={i}>
                                        • Milestone {i + 1}: <span className={getMilestoneStatusClass(i)}>{getMilestoneStatusText(i)}</span>
                                        {i < project.approvedMilestones && (
                                            <span className="text-sm text-gray-600 ml-2">
                                                (Released: {(parseFloat(project.targetAmount) / project.totalMilestones).toFixed(4)} ETH)
                                            </span>
                                        )}
                                        {i === project.approvedMilestones && project.status === "FUNDED" && (
                                            <span className="text-sm text-blue-600 ml-2">
                                                (Current milestone)
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="submit-button">
                            <ButtonVariant 
                                type="submit" 
                                text={"CANCEL PROJECT"}
                                disabled={false}
                                style="px-10 py-5 text-lg bg-gray-600 hover:bg-gray-700"
                                clickHandler= {handleCancel}
                            />
                            <ButtonVariant 
                                type="submit" 
                                text={"SUBMIT MILESTONE"}
                                disabled={false}
                                style="px-10 py-5 text-lg bg-gray-600 hover:bg-gray-700"
                                clickHandler= {handleMilestoneSubmit}
                            />
                            <ButtonVariant 
                                type="submit" 
                                text={"RELEASE MILESTONE"}
                                disabled={false}
                                style="px-10 py-5 text-lg bg-gray-600 hover:bg-gray-700"
                                clickHandler= {handleReleaseMilestone}
                            />
                        </div>
                                  <ToastContainer />
                              </Form>
                          </div>
                      </div>
                  )}
              </Formik>
          );
}
export default ProjectDetails;

