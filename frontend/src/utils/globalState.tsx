import { createGlobalState } from 'react-hooks-global-state'
import { GlobalState } from '../types'

const { setGlobalState, useGlobalState, getGlobalState } = createGlobalState<GlobalState>({
  account: "",
  accountBalance: "",
  fltBalance: "",
  active: false,
  allProjects: [],
  project: null,
  contributions: [],
  createdProjects: [],
  contributedProjects: [],
  isOwner: false,
  pendingMilestones: [],
})

export { setGlobalState, useGlobalState, getGlobalState }