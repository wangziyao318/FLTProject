import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import ButtonVariant from "../components/ButtonVariant";
import { ToastContainer } from 'react-toastify';
import { toastSuccess, toastError } from '../components/toastMsg';
import { useGlobalState } from '../utils/globalState';
import { useNavigate } from "react-router";
import { releaseMilestone, cancelProject } from "../utils/contractServices";
import { 
    getProjectStatus, 
    getMilestoneProgress, 
    canReleaseMilestone, 
    canCancel, 
    formatAddress 
} from "../utils/helpers";
import { Project, Contribution } from "../types"; // Import your type definitions
import { promiseHooks } from 'v8';
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
  
  const status = getProjectStatus(project);
  const milestoneProgress = getMilestoneProgress(project);
  const userCanCancel = canCancel(project, account);
  const userCanReleaseMilestone = canReleaseMilestone(project, true);
        
  const handleMilestoneSubmit = async () => {
    if (!userCanReleaseMilestone) {
      toastError("Cannot release milestone at this time!");
      return;
    }
    
    const [success, msg] = await releaseMilestone(project.id, project.metadataUri);
    if (success) {
      toastSuccess('Successfully cancelled the project!');
    } else {
      toastError(`Failed to cancel: ${msg}`);
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

