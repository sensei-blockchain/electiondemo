App = {
  web3Provider: null,
  contracts: {},
  account: "0x0",
  hasVoted: false,

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    if (typeof web3 !== "undefined") {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider(
        "http://localhost:7545"
      );
    }
    web3 = new Web3(App.web3Provider);
    return App.initContract();
  },

  initContract: function() {
    $.getJSON("Election.json", function(election) {
      App.contracts.Election = TruffleContract(election);
      App.contracts.Election.setProvider(App.web3Provider);

      App.listenForEvents();

      return App.render();
    });
  },

  listenForEvents: async function() {
    const instance = await App.contracts.Election.deployed();
    instance
      .allEvents(
        {},
        {
          fromBlock: 0,
          toBlock: "latest"
        }
      )
      .watch(function(error, event) {
        console.log("event triggered", event);
        App.render();
      });
  },

  render: async function() {
    const loader = $("#overlay");
    const content = $("#content");
    const chairpersonContent = $(".chairperson");
    $(".vote-switch input").attr("disabled", false);
    loader.show();
    content.hide();
    $("#errorText").hide();

    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("Your Account: " + account);
      }
    });

    try {
      const instance = await App.contracts.Election.deployed();
      const chairpersonAddress = await instance.chairperson();
      if (App.account !== chairpersonAddress) {
        chairpersonContent.hide();
      }
      $("#candidatesName").val("");
      $("#voterAddress").val("");

      let candidatesResults = $("#candidatesResults");
      let candidatesSelect = $("#candidatesSelect");

      const voteStatus = await instance.votingStarted();
      if (voteStatus) {
        $(".vote-switch input").attr("checked", true);
        $(".vote-status.started").addClass("active");
      } else {
        $(".vote-switch input").attr("checked", false);
        $(".vote-status.stopped").addClass("active");
      }

      const candidatesCount = await instance.candidatesCount();
      for (var i = 1; i <= candidatesCount; i++) {
        const candidate = await instance.candidates(i);
        var id = candidate[0];
        var name = candidate[1];
        var voteCount = candidate[3];

        // Render candidate Result
        const candidateTemplate =
          "<tr id=" +
          id +
          "><th>" +
          id +
          "</th><td>" +
          name +
          "</td><td>" +
          voteCount +
          "</td></tr>";
        const candidateOption =
          "<option value='" + id + "' >" + name + "</ option>";

        if (!$("#candidatesResults tr#" + id).length) {
          candidatesResults.append(candidateTemplate);
          candidatesSelect.append(candidateOption);
        } else {
          $("#candidatesResults tr#" + id).replaceWith(candidateTemplate);
        }
      }

      loader.hide();
      content.show();
      $("form").show();
      const voter = await instance.voters(App.account);
      const isVoterRegistered = voter[0];
      const hasVoted = voter[1];
      if (!isVoterRegistered) {
        $("#voteForm").hide();
        $("#notAuthorized").show();
      } else if (!voteStatus && App.account !== chairpersonAddress) {
        $("#voteForm").hide();
        $("#notStarted").show();
      } else if (hasVoted) {
        $("#voteForm").hide();
        $("#alreadyVoted").show();
      } else {
        $("#notAuthorized").hide();
      }
    } catch (error) {
      console.warn(error);
    }
  },

  toggleVoting: async function() {
    try {
      $(".vote-switch input").attr("disabled", true);
      $("#overlay").show();
      if ($(".vote-switch input").prop("checked")) {
        $(".vote-status.stopped").removeClass("active");
        $(".vote-status.started").addClass("active");
      } else {
        $(".vote-status.stopped").addClass("active");
        $(".vote-status.started").removeClass("active");
      }
      const instance = await App.contracts.Election.deployed();
      await instance.toggleVoting({ from: App.account });
    } catch (error) {
      console.log(error);
      location.reload();
    }
  },

  addCandidate: async function() {
    try {
      $("#overlay").show();
      const candidatesName = $("#candidatesName").val();
      const instance = await App.contracts.Election.deployed();
      await instance.addCandidate(candidatesName, { from: App.account });
    } catch (error) {
      console.log(error);
      App.render();
      $("#errorText").show();
    }
  },

  addVoter: async function() {
    try {
      $("#overlay").show();
      const voterAddress = $("#voterAddress").val();
      const instance = await App.contracts.Election.deployed();
      await instance.giveRightToVote(voterAddress, { from: App.account });
    } catch (error) {
      console.log(error);
      App.render();
      $("#errorText").show();
    }
  },

  castVote: async function() {
    $("#overlay").show();
    var candidateId = $("#candidatesSelect").val();
    try {
      const instance = await App.contracts.Election.deployed();
      await instance.vote(candidateId, { from: App.account });
    } catch (err) {
      console.error(err);
      App.render();
      $("#errorText").show();
    }
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
