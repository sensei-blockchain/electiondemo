App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',

  init: function () {
    return App.initWeb3();
  },

  initWeb3: function () {
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },

  initContract: function () {
    $.getJSON("Election.json", function (election) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Election = TruffleContract(election);
      // Connect provider to interact with contract
      App.contracts.Election.setProvider(App.web3Provider);

      // App.listenForEvents();

      return App.render();
    });
  },

  castVote: async function () {
    try {
      let candidateId = $('#candidatesSelect').val();
      const instance = await App.contracts.Election.deployed();
      await instance.vote(candidateId, { from: App.account });
      $("#content").hide();
      $("#loader").show();
      App.render();
    } catch (error) {
      console.log(error)
    }
  },

  toggleVoting: async function () {
    try {
      $("#votingStatus button").attr("disabled", true);
      const instance = await App.contracts.Election.deployed();
      await instance.toggleVoting({ from: App.account });
      $("#votingStatus button").attr("disabled", false);
      App.render();
    } catch (error) {
      console.log(error)
    }
  },

  updateFields: async function () {
    const electionInstance = await App.contracts.Election.deployed();
    const candidatesCount = await electionInstance.candidatesCount();
    let candidatesResults = $("#candidatesResults");
    candidatesResults.empty();
    let candidatesSelect = $('#candidatesSelect');
    candidatesSelect.empty();
    let removeCandidatesSelect = $('#removeCandidatesSelect');
    removeCandidatesSelect.empty();

    const voteStatus = await electionInstance.votingStarted()
    voteStatus ? $("#votingStatus button").text("Stop") : $("#votingStatus button").text("Start")

    for (let i = 1; i <= candidatesCount; i++) {
      const candidate = await electionInstance.candidates(i)
      if (candidate[0]) {
        let id = candidate[0];
        let name = candidate[1];
        let voteCount = candidate[3];

        // Render candidate Result
        let candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>"
        candidatesResults.append(candidateTemplate);

        // Render candidate ballot option
        let candidateOption = "<option value='" + id + "' >" + name + "</ option>"
        candidatesSelect.append(candidateOption);
        removeCandidatesSelect.append(candidateOption);
      }
    }
  },

  addCandidate: async function () {
    try {
      let candidatesName = $('#candidatesName').val();
      const instance = await App.contracts.Election.deployed();
      await instance.addCandidate(candidatesName, { from: App.account });
      App.render();
    } catch (error) {
      console.log(error)
    }
  },

  addVoter: async function () {
    try {
      let voterAddress = $('#voterAddress').val();
      const instance = await App.contracts.Election.deployed();
      await instance.giveRightToVote(voterAddress, { from: App.account });
      App.render();
    } catch (error) {
      console.log(error)
    }
  },

  render: async function () {
    let loader = $("#loader");
    let content = $("#content");
    let chairpersonContent = $("#chairperson");

    // Load account data
    web3.eth.getCoinbase(function (err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("Your Account: " + account);
      }
    });

    // Load contract data
    const electionInstance = await App.contracts.Election.deployed();
    const chairpersonAddress = await electionInstance.chairperson();
    if (App.account !== chairpersonAddress) {
      chairpersonContent.hide();
    }

    loader.show();
    content.hide();

    await App.updateFields();

    const voter = await electionInstance.voters(App.account);
    if (voter[1]) {
      $('form').hide();
    }
    loader.hide();
    content.show();
  }
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
