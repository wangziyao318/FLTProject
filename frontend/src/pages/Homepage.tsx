import Slogan from "components/Slogan";

const HomePage = () => {
    return (
        <div style={{ padding: "2rem" }}>
            <Slogan
                text1="Fund the Future"
                text2="Enpowering Creators with Milestone-based Funding"
            />

            <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-start",
                gap: "6rem",
                marginTop: "2rem",
                flexWrap: "wrap"
            }}>
                {/* Creator Actions */}
                <div>
                    <h2>🎨 Creator Actions</h2>
                    <ul>
                        <li><a href="/creator/create">Create Project</a></li>
                        <li><a href="/creator/cancel">Cancel Project</a></li>
                        <li><a href="/creator/submit">Submit Milestone</a></li>
                        <li><a href="/creator/execute">Execute Proposal</a></li>
                    </ul>
                </div>

                {/* Fan Actions */}
                <div>
                    <h2>💖 Fan Actions</h2>
                    <ul>
                        <li><a href="/fan/contribute">Contribute to Project</a></li>
                        <li><a href="/fan/withdraw">&nbsp;Withdraw Contribution</a></li>
                        <li><a href="/fan/vote">Vote on Proposal</a></li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
