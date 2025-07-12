// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Whistleblower {
    struct Report {
        uint id;
        string ipfsHash; // Store IPFS Hash
        address reporter;
        bool resolved;
    }

    uint public reportCount; // Tracks report IDs
    mapping(uint => Report) public reports; // Store reports by ID
    mapping(address => uint[]) public userReports; // Store report IDs by user

    event NewReport(uint id, string ipfsHash, address indexed reporter);
    event ReportResolved(uint id, address indexed resolver);

    // Submit a new whistleblower report
    function submitReport(string memory _ipfsHash) public {
        reports[reportCount] = Report(reportCount, _ipfsHash, msg.sender, false);
        userReports[msg.sender].push(reportCount);
        emit NewReport(reportCount, _ipfsHash, msg.sender);
        reportCount++;
    }

    // Get a report by its ID
    function getReport(uint _id) public view returns (string memory, address, bool) {
        require(_id < reportCount, "Invalid report ID");
        Report storage report = reports[_id];
        return (report.ipfsHash, report.reporter, report.resolved);
    }

    // Get all reports submitted by a specific user
    function getUserReports(address _user) public view returns (uint[] memory) {
        return userReports[_user];
    }

    // Mark a report as resolved (ONLY the contract owner)
    function resolveReport(uint _id) public {
        require(_id < reportCount, "Invalid report ID");
        require(!reports[_id].resolved, "Report already resolved");

        reports[_id].resolved = true;
        emit ReportResolved(_id, msg.sender);
    }
}
