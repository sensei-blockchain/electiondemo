App = {
  web3Provider: null,
  contracts: {},
  account: "0x0",
  hasVoted: false,

  // Start app
  start: async function () {
    App.initWeb3();
    await App.initContract();
    App.listenForEvents();
    App.render();
  },

  // Initialize web3
  initWeb3: function () {
    if (typeof web3 !== "undefined") {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider("http://localhost:7545");
    }
    web3 = new Web3(App.web3Provider);
  },

  // Initialize election contract
  initContract: async function () {
    const election = await $.getJSON("Election.json");
    App.contracts.Election = TruffleContract(election);
    App.contracts.Election.setProvider(App.web3Provider);
  },

  // Watch events emitted by the contract and re-render
  listenForEvents: async function () {
    const instance = await App.contracts.Election.deployed();
    instance.allEvents({}, {
      fromBlock: 0,
      toBlock: "latest"
    }).watch(function (error, event) {
      console.log("event triggered", event);
      App.render();
    });
  },

  showLoader: function () {
    $("#overlay").show();
    $("input").attr("disabled", true);
  },

  hideLoader: function () {
    $("#overlay").hide();
    $("input").attr("disabled", false);
  },

  render: async function () {
    const content = $("#content");
    $(".vote-switch input").attr("disabled", false);
    App.showLoader();
    content.hide();
    $("#errorText").hide();

    // Get the current account address
    web3.eth.getCoinbase(function (err, account) {
      if (err === null) {
        App.account = account;
        $('#accountAddress').html('Your Account: ' + account);
      }
    });

    try {
      // Get an election contract instance
      const instance = await App.contracts.Election.deployed();
      // Get the chairperson address
      const chairpersonAddress = await instance.chairperson();

      const chairpersonContent = $('.chairperson');
      if (App.account !== chairpersonAddress) {
        chairpersonContent.hide();
      }

      const voteStatus = await instance.votingStarted();
      if (voteStatus) {
        $('.vote-switch input').attr('checked', true);
        $('.vote-status.started').addClass('active');
      } else {
        $('.vote-switch input').attr('checked', false);
        $('.vote-status.stopped').addClass('active');
      }

      $('#candidatesName').val('');
      $('#voterAddress').val('');

      // Load the candidates list
      let candidatesResults = $('#candidatesResults');
      let candidatesSelect = $('#candidatesSelect');
      // Get candidates count
      const candidatesCount = await instance.candidatesCount();
      for (var i = 1; i <= candidatesCount; i++) {
        // Get the candidate data on ith index
        const candidate = await instance.candidates(i);
        var id = candidate[0];
        var name = candidate[1];
        var voteCount = candidate[3];

        // Render candidate result
        const candidateTemplate = '<tr id=' + id + '><th>' + id + '</th><td>' + name + '</td><td>' + voteCount + '</td></tr>';
        const candidateOption = "<option value='" + id + "' >" + name + '</ option>';
        if (!$('#candidatesResults tr#' + id).length) {
          candidatesResults.append(candidateTemplate);
          candidatesSelect.append(candidateOption);
        } else {
          $('#candidatesResults tr#' + id).replaceWith(candidateTemplate);
        }
      }

      App.hideLoader();
      content.show();
      $('form').show();

      // Get voter data for the current account
      const voter = await instance.voters(App.account);
      // Check if current account is authorized to vote
      const isVoterRegistered = voter[0];
      // Check if current account has already voted
      const hasVoted = voter[1];

      if (isVoterRegistered && voteStatus && !hasVoted) {
        $('#voteForm').show();
      } else {
        $('#voteForm').hide();
      }
      if (!isVoterRegistered) {
        $('#notAuthorized').show();
      } else if (!voteStatus && App.account !== chairpersonAddress) {
        $('#notStarted').show();
      } else if (hasVoted) {
        $('#alreadyVoted').show();
      } else {
        $('#notAuthorized').hide();
      }
    } catch (error) {
      console.warn(error);
    }
  },

  toggleVoting: async function () {
    try {
      $('.vote-switch input').attr('disabled', true);
      App.showLoader();
      if ($('.vote-switch input').prop('checked')) {
        $('.vote-status.stopped').removeClass('active');
        $('.vote-status.started').addClass('active');
      } else {
        $('.vote-status.stopped').addClass('active');
        $('.vote-status.started').removeClass('active');
      }
      const instance = await App.contracts.Election.deployed();
      // Call the contract function for toggling the vote status
      await instance.toggleVoting({ from: App.account });
    } catch (error) {
      console.log(error);
      location.reload();
    }
  },

  addCandidate: async function () {
    try {
      App.showLoader();
      const candidatesName = $('#candidatesName').val();
      const instance = await App.contracts.Election.deployed();
      // Call the contract function to add new candidate
      await instance.addCandidate(candidatesName, { from: App.account });
    } catch (error) {
      console.log(error);
      App.render();
      $('#errorText').show();
    }
  },

  addVoter: async function () {
    try {
      App.showLoader();
      const voterAddress = $('#voterAddress').val();
      const instance = await App.contracts.Election.deployed();
      // Call the contract function to authorize voter
      await instance.giveRightToVote(voterAddress, { from: App.account });
    } catch (error) {
      console.log(error);
      App.render();
      $('#errorText').show();
    }
  },

  castVote: async function () {
    App.showLoader();
    var candidateId = $('#candidatesSelect').val();
    try {
      const instance = await App.contracts.Election.deployed();
      // Call contract function to cast new vote
      await instance.vote(candidateId, { from: App.account });
    } catch (err) {
      console.error(err);
      App.render();
      $('#errorText').show();
    }
  }
};

$(function () {
  $(window).load(function () {
    App.start();
  });
});
