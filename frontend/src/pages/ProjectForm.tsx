import { Formik, Form, Field, ErrorMessage, FormikHelpers } from 'formik';
import ButtonVariant from '../components/ButtonVariant';
import { createProject } from '../utils/contractServices';
import { toastSuccess, toastError } from '../components/toastMsg';
import { ToastContainer } from 'react-toastify';
import * as Yup from 'yup';
import { CreateProjectFormValues } from '../types';
import { useGlobalState } from '../utils/globalState';
import './ProjectForm.css';

const ProjectForm = () => {
    const initialValues: CreateProjectFormValues = {
        title: "",
        description: "",
        targetAmount: "",
        totalMilestones: "",
        imageUrl: ""
    };

    const [isBlacklisted] = useGlobalState('isBlacklisted');

    const handleSubmit = async (
        values: CreateProjectFormValues, 
        { resetForm, setSubmitting }: FormikHelpers<CreateProjectFormValues>
    ) => {

        if (isBlacklisted) {
            toastError("Your account has been blacklisted. You cannot create projects.");
            setSubmitting(false);
            return;
        }

        try {
            const metadata = {
                title: values.title,
                description: values.description,
                imageUrl: values.imageUrl,
                milestones: Array.from({ length: parseInt(values.totalMilestones) }, (_, i) => ({
                    title: `Milestone ${i+1}`,
                    description: `Description for milestone ${i+1}`
                }))
            };
            
            const metadataUri = `ipfs://QmExample${Buffer.from(JSON.stringify(metadata)).toString('base64').substring(0, 10)}`;
            
            const projectData = {
                totalMilestones: parseInt(values.totalMilestones),
                targetAmount: values.targetAmount,
                metadataUri: metadataUri
            };
            
            const [success, msg] = await createProject(projectData);
            
            if (success) {
                toastSuccess(`Project "${values.title}" created successfully!`);
                resetForm();
            } else {
                toastError(`Failed to create project: ${msg}`);
            }
        } catch (error: unknown) {
            console.error("Error creating project:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            toastError(`Error: ${errorMessage}`);
        } finally {
            setSubmitting(false);
        }
    };

    const blacklistedWarning = isBlacklisted ? (
        <div className="error-box mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            <h3 className="font-bold">Account Blacklisted</h3>
            <p>Your account has been blacklisted. You cannot create new projects or interact with existing ones.</p>
            <p>This may happen due to canceling projects or withdrawing contributions.</p>
        </div>
    ) : null;

    const validationSchema = Yup.object().shape({
        title: Yup.string()
            .min(2, 'Title must be at least 2 characters')
            .max(100, 'Title must be less than 100 characters')
            .required('Title is required'),
        description: Yup.string()
            .min(10, 'Description must be at least 10 characters')
            .max(1000, 'Description must be less than 1000 characters')
            .required('Description is required'),
        targetAmount: Yup.number()
            .positive('Target amount must be positive')
            .min(0.01, 'Target amount must be at least 0.01 ETH')
            .required('Target amount is required'),
        totalMilestones: Yup.number()
            .integer('Must be a whole number')
            .min(1, 'At least 1 milestone is required')
            .max(10, 'Maximum 10 milestones allowed')
            .required('Number of milestones is required'),
        imageUrl: Yup.string()
            .url('Image URL is not valid')
    });

    return (
        <Formik
            initialValues={initialValues}
            onSubmit={handleSubmit}
            validationSchema={validationSchema}
        >
            {({ isSubmitting, errors, touched }) => (
                <div className="form-wrapper">
                    <div className="project-form-container">
                        <Form>
                            <div className="form-header">
                                <h1>Create Your Project</h1>
                            </div>

                            {blacklistedWarning}
                            
                            {/* Project Title */}
                            <div className="form-field">
                                <label>
                                    <span className="field-label">Project Title:</span>
                                    <Field 
                                        type="text" 
                                        name="title" 
                                        placeholder="Enter project title"
                                        className={`form-input ${
                                            errors.title && touched.title ? 'input-error' : ''
                                        }`}
                                    />
                                    <ErrorMessage name="title" component="div" className="error-message" />
                                </label>
                            </div>

                            {/* Description */}
                            <div className="form-field">
                                <label>
                                    <span className="field-label">Description:</span>
                                    <Field 
                                        as="textarea" 
                                        name="description" 
                                        rows={6}
                                        placeholder="Describe your project and its milestones"
                                        className={`form-input ${
                                            errors.description && touched.description ? 'input-error' : ''
                                        }`}
                                    />
                                    <ErrorMessage name="description" component="div" className="error-message" />
                                </label>
                            </div>

                            {/* Funding Target */}
                            <div className="form-field">
                                <label>
                                    <span className="field-label">Funding Target (ETH):</span>
                                    <Field 
                                        type="number" 
                                        name="targetAmount"
                                        step="0.01"
                                        placeholder="Enter funding target in ETH"
                                        className={`form-input ${
                                            errors.targetAmount && touched.targetAmount ? 'input-error' : ''
                                        }`}
                                    />
                                    <ErrorMessage name="targetAmount" component="div" className="error-message" />
                                </label>
                            </div>

                            {/* Milestones */}
                            <div className="form-field">
                                <label>
                                    <span className="field-label">Number of Milestones:</span>
                                    <Field 
                                        type="number" 
                                        name="totalMilestones" 
                                        min="1"
                                        placeholder="How many milestones will your project have?"
                                        className={`form-input ${
                                            errors.totalMilestones && touched.totalMilestones ? 'input-error' : ''
                                        }`}
                                    />
                                    <ErrorMessage name="totalMilestones" component="div" className="error-message" />
                                    <p className="milestone-note">
                                        Each milestone will receive an equal portion of the total funding.
                                    </p>
                                </label>
                            </div>

                            {/* Image URL */}
                            <div className="form-field">
                                <label>
                                    <span className="field-label">Project Image URL:</span>
                                    <Field 
                                        type="url" 
                                        name="imageUrl"
                                        placeholder="Enter image URL for your project"
                                        className={`form-input ${
                                            errors.imageUrl && touched.imageUrl ? 'input-error' : ''
                                        }`}
                                    />
                                    <ErrorMessage name="imageUrl" component="div" className="error-message" />
                                </label>
                            </div>

                            <div className="info-box">
                                <h4>Important Information:</h4>
                                <ul>
                                    <li>• Each milestone will need to be approved before funds are released</li>
                                    <li>• You'll receive FLT tokens as rewards for completed milestones</li>
                                    <li>• Failing to complete milestones may result in penalties</li>
                                    <li>• Cancelling your project after funding will incur a penalty</li>
                                </ul>
                            </div>

                            <div className="submit-button">
                                <ButtonVariant 
                                    type="submit" 
                                    text={isSubmitting ? "CREATING..." : "CREATE PROJECT"}
                                    disabled={isSubmitting || isBlacklisted}
                                    style="px-10 py-5 text-lg bg-gray-600 hover:bg-gray-700"
                                    clickHandler={() => {}} // Form will handle submission
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

export default ProjectForm;