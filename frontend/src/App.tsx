import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Header from "components/Header";
import HomePage from "./pages/HomePage";
import CreateProject from "./pages/Creator/CreateProject";
import CancelProject from "pages/Creator/CancelProject";
import SubmitMilestone from "pages/Creator/SubmitMilestone";
import ExecuteProposal from "pages/Creator/ExecuteProposal";
import Contribute from "pages/Fan/Contribute";
import Withdraw from "pages/Fan/Withdraw";
import Vote from "pages/Fan/Vote";

const App = () => {
    return (
        <Router>
            <Header />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/creator/create" element={<CreateProject />} />
                <Route path="/creator/cancel" element={<CancelProject />} />
                <Route path="/creator/submit" element={<SubmitMilestone />} />
                <Route path="/creator/execute" element={<ExecuteProposal />} />

                <Route path="/fan/contribute" element={<Contribute />} />
                <Route path="/fan/withdraw" element={<Withdraw />} />
                <Route path="/fan/vote" element={<Vote />} />
            </Routes>
        </Router>
    );
};

export default App;
