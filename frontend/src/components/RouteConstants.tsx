export const rootPath = "/"
export const userProfilePath = "/profile"
export const createProjectPath = "/create-project"
export const projectsPath = "/projects"
export const projectPath = "/projects/:id"
export const governancePath = "/governance"

// Builder functions
export const buildProjectPath = (id: number | string): string => `/projects/${id}`
export const buildAbsoluteProjectPath = (id: number | string): string => `/projects/${id}`