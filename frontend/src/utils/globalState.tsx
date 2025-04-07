import { createGlobalState } from 'react-hooks-global-state'
import { GlobalState } from '../types'

const { setGlobalState, useGlobalState, getGlobalState } = createGlobalState<GlobalState>({
  account: "",
  accountBalance: "",
  fltBalance: "",
  creatorTokenBalance: "",
  fanTokenBalance: "",
  active: false,
  allProjects: [],
  project: null,
  contributions: [],
  createdProjects: [],
  contributedProjects: [],
  isOwner: false,
  isBlacklisted: false,
  pendingMilestones: [],
})

export { setGlobalState, useGlobalState, getGlobalState }