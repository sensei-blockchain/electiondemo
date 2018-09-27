pragma solidity ^0.4.24;

contract Election {

  struct Voter {
    bool registered;
    bool voted;
  }

  struct Candidate {
    string name;
    bool registered;
    uint voteCount;
  }

  uint public candidatesCount;
  address public chairperson;
  bool public votingStarted;

  mapping(address => Voter) public voters;
  mapping(uint => Candidate) public candidates;

  event CandidateAddedEvent (uint indexed candidateId);
  event CandidateRemovedEvent (uint indexed candidateId);
  event VotedEvent (address indexed voterAddress, uint indexed candidateId);

  constructor() public {
    chairperson = msg.sender;
  }

  function addCandidate(string candidateName) public {
    require(!votingStarted);
    require(msg.sender == chairperson);

    candidatesCount++;
    candidates[candidatesCount] = Candidate(candidateName, true, 0);

    emit CandidateAddedEvent(candidatesCount);
  }

  function removeCandidate(uint candidateId) public {
    require(!votingStarted);
    require(msg.sender == chairperson);

    delete candidates[candidateId];

    emit CandidateRemovedEvent(candidateId);
  }

  function giveRightToVote (address voterAddress) public {
    require(!votingStarted);
    require(!voters[voterAddress].registered);

    voters[voterAddress].registered = true;
  }

  function vote (uint candidateId) public {
    require(votingStarted);
    require(voters[msg.sender].registered && !voters[msg.sender].voted);
    require(candidates[candidateId].registered);

    voters[msg.sender].voted = true;
    candidates[candidateId].voteCount++;

    emit VotedEvent(msg.sender, candidateId);
  }

  function startVoting() public {
    require(msg.sender == chairperson);
    require(!votingStarted);

    votingStarted = true;
  }

  function stopVoting() public {
    require(msg.sender == chairperson);
    require(votingStarted);

    votingStarted = false;
  }

  function winningProposal() public view returns (string winningCandidate) {
    uint256 winningVoteCount = 0;
    for (uint i = 1; i <= candidatesCount; i++) {
      if (candidates[i].voteCount > winningVoteCount) {
        winningVoteCount = candidates[i].voteCount;
        winningCandidate = candidates[i].name;
      }
    }
  }
}
