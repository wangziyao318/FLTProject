import { Formik, Form, Field, ErrorMessage, FormikHelpers } from 'formik';
import ButtonVariant from '../components/ButtonVariant';
import { createProject } from '../utils/contractServices';
import { toastSuccess, toastError } from '../components/toastMsg';
import { ToastContainer } from 'react-toastify';
import * as Yup from 'yup';
import { CreateProjectFormValues, FormHelpers } from '../types';

const ProjectForm = () => {
    const initialValues: CreateProjectFormValues = {
        title: "",
        description: "",
        targetAmount: "",
        totalMilestones: "",
        imageUrl: ""
    };

    const handleSubmit = async (
        values: CreateProjectFormValues, 
        { resetForm, setSubmitting }: FormikHelpers<CreateProjectFormValues>
    ) => {
        try {
            // Create metadata object to store on IPFS (in a real app)
            const metadata = {
                title: values.title,
                description: values.description,
                imageUrl: values.imageUrl,
                milestones: Array.from({ length: parseInt(values.totalMilestones) }, (_, i) => ({
                    title: `Milestone ${i+1}`,
                    description: `Description for milestone ${i+1}`
                }))
            };
            
            // In a real app, you would upload this to IPFS and get a hash
            // For this demo, we'll just stringify it and use it as the URI
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
                <div className='flex justify-center'>
                    <div className="flex flex-col justify-center items-center rounded-xl sm:p-20 p-4 bg-gray-100 w-fit">
                        <Form>
                            <div className="flex justify-center items-center p-5 sm:min-w-[380px]">
                                <h1 className='font-bold text-5xl'>Create Your Project</h1>
                            </div>
                            
                            <div className="flex flex-auto flex-wrap py-3">
                                <label className="w-full flex flex-col">
                                    <span className="font-medium text-xs text-gray-600 mb-1">
                                        Project Title:
                                    </span>
                                    <Field 
                                        type="text" 
                                        name="title" 
                                        placeholder="Enter project title"
                                        className={`py-4 sm:px-5 px-4 border-[1px] outline-none ${
                                            errors.title && touched.title 
                                                ? 'border-red-500 bg-red-50' 
                                                : 'border-gray-900 bg-transparent'
                                        } text-black text-sm placeholder:text-gray-400 rounded-lg sm:min-w-[250px]`}
                                    />
                                    <ErrorMessage name="title" component="div" className="text-xs text-red-700 mt-1" />
                                </label>
                            </div>

                            <div className="flex flex-auto flex-wrap py-3">
                                <label className="w-full flex flex-col">
                                    <span className="font-medium text-xs text-gray-600 mb-1">
                                        Description:
                                    </span>
                                    <Field 
                                        as="textarea" 
                                        name="description" 
                                        rows={10}
                                        placeholder="Describe your project and its milestones"
                                        className={`py-4 sm:px-5 px-4 border-[1px] outline-none ${
                                            errors.description && touched.description 
                                                ? 'border-red-500 bg-red-50' 
                                                : 'border-gray-900 bg-transparent'
                                        } text-black text-sm placeholder:text-gray-400 rounded-lg sm:min-w-[250px]`}
                                    />
                                    <ErrorMessage name="description" component="div" className="text-xs text-red-700 mt-1" />
                                </label>
                            </div>

                            <div className="flex flex-auto flex-wrap py-3">
                                <label className="w-full flex flex-col">
                                    <span className="font-medium text-xs text-gray-600 mb-1">
                                        Funding Target (ETH):
                                    </span>
                                    <Field 
                                        type="number" 
                                        name="targetAmount"
                                        step="0.01"
                                        placeholder="Enter funding target in ETH"
                                        className={`py-4 sm:px-5 px-4 border-[1px] outline-none ${
                                            errors.targetAmount && touched.targetAmount 
                                                ? 'border-red-500 bg-red-50' 
                                                : 'border-gray-900 bg-transparent'
                                        } text-black text-sm placeholder:text-gray-400 rounded-lg sm:min-w-[250px]`}
                                    />
                                    <ErrorMessage name="targetAmount" component="div" className="text-xs text-red-700 mt-1" />
                                </label>
                            </div>

                            <div className="flex flex-auto flex-wrap py-3">
                                <label className="w-full flex flex-col">
                                    <span className="font-medium text-xs text-gray-600 mb-1">
                                        Number of Milestones:
                                    </span>
                                    <Field 
                                        type="number" 
                                        name="totalMilestones" 
                                        min="1"
                                        placeholder="How many milestones will your project have?"
                                        className={`py-4 sm:px-5 px-4 border-[1px] outline-none ${
                                            errors.totalMilestones && touched.totalMilestones 
                                                ? 'border-red-500 bg-red-50' 
                                                : 'border-gray-900 bg-transparent'
                                        } text-black text-sm placeholder:text-gray-400 rounded-lg sm:min-w-[250px]`}
                                    />
                                    <ErrorMessage name="totalMilestones" component="div" className="text-xs text-red-700 mt-1" />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Each milestone will receive an equal portion of the total funding.
                                    </p>
                                </label>
                            </div>

                            <div className="flex flex-auto flex-wrap py-3">
                                <label className="w-full flex flex-col">
                                    <span className="font-medium text-xs text-gray-600 mb-1">
                                        Project Image URL:
                                    </span>
                                    <Field 
                                        type="url" 
                                        name="imageUrl"
                                        placeholder="Enter image URL for your project"
                                        className={`py-4 sm:px-5 px-4 border-[1px] outline-none ${
                                            errors.imageUrl && touched.imageUrl 
                                                ? 'border-red-500 bg-red-50' 
                                                : 'border-gray-900 bg-transparent'
                                        } text-black text-sm placeholder:text-gray-400 rounded-lg sm:min-w-[250px]`}
                                    />
                                    <ErrorMessage name="imageUrl" component="div" className="text-xs text-red-700 mt-1" />
                                </label>
                            </div>

                            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <h4 className="font-bold text-blue-800 text-sm mb-2">Important Information:</h4>
                                <ul className="text-xs text-blue-700 space-y-1">
                                    <li>• Each milestone will need to be approved by governance before funds are released</li>
                                    <li>• You'll receive FLT tokens as rewards for completed milestones</li>
                                    <li>• Failing to complete milestones may result in FLT penalties</li>
                                    <li>• Cancelling your project after funding will incur a penalty</li>
                                </ul>
                            </div>

                            <div className="flex justify-center items-center mt-6">
                                <ButtonVariant 
                                    type="submit" 
                                    text={isSubmitting ? "CREATING..." : "CREATE PROJECT"}
                                    style="px-10 py-5 text-lg bg-gray-600 hover:bg-gray-700"
                                    disabled={isSubmitting}
                                    clickHandler={() => {}} // Form will handle submission
                                />
                            </div>
                            
                            <ToastContainer 
                                className="text-lg text-gray-600 text-center font-bold"
                                style={{ height: '100px', width: '300px' }}
                            />
                        </Form>
                    </div>
                </div>
            )}
        </Formik>
    );
}

export default ProjectForm;