pragma solidity ^0.4.24;

contract Election {

    struct Voter {
        bool registered;
        bool voted;
    }

    struct Candidate {
        uint id;
        string name;
        bool registered;
        uint voteCount;
    }

    uint public candidatesCount;
    address public chairperson;
    bool public votingStarted;

    mapping(address => Voter) public voters;
    mapping(uint => Candidate) public candidates;

    event VotingStatusEvent (bool status);
    event CandidateAddedEvent (uint indexed candidateId);
    event CandidateRemovedEvent (uint indexed candidateId);
    event VoterAddedEvent ();
    event VotedEvent (address indexed voterAddress, uint indexed candidateId);

    constructor() public {
        chairperson = msg.sender;
    }

    function addCandidate(string candidateName) public {
        require(!votingStarted);
        require(msg.sender == chairperson);

        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, candidateName, true, 0);

        emit CandidateAddedEvent(candidatesCount);
    }

    function giveRightToVote (address voterAddress) public {
        require(!votingStarted);
        require(!voters[voterAddress].registered);

        voters[voterAddress].registered = true;
        emit VoterAddedEvent();
    }

    function vote (uint candidateId) public {
        require(votingStarted);
        require(voters[msg.sender].registered && !voters[msg.sender].voted);
        require(candidates[candidateId].registered);

        voters[msg.sender].voted = true;
        candidates[candidateId].voteCount++;

        emit VotedEvent(msg.sender, candidateId);
    }

    function toggleVoting() public {
        require(msg.sender == chairperson);

        votingStarted = !votingStarted;

        emit VotingStatusEvent(votingStarted);
    }
}
