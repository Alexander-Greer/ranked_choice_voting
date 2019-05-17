// *********************************************************************
// Project           : The Haverford School Student Council / Honor Council Elections
// Program name      : RCV_Script.gs
// Author            : Alexander Harrison Greer '20
// Date created      : May 5, 2019
// Purpose           : Input ranked choice voting data in an election format and determine the winner(s)
// Github            : https://github.com/Alexander-Greer/ranked_choice_voting
// Revision History  :
//
// Date(YYYYMMDD) Author      Time Spent    Revision
// 20190505       A.H.Greer   5 hrs         Python Development
//
// Date(YYYYMMDD) Author      Time Spent    Revision
// 20190509       A.H.Greer   2 hrs         Python Development Revisions
// 
// Date(YYYYMMDD) Author      Time Spent    Revision
// 20190511       A.H.Greer   4 hrs         Python Development / JS Integration
//
// Date(YYYYMMDD) Author      Time Spent    Revision
// 20190512       A.H.Greer   4 hrs         JS and Spreadsheet Integration
// 
// Date(YYYYMMDD) Author      Time Spent    Revision
// 20190514       A.H.Greer   1 hrs         Fixed Reapportioning Oversight
// 
// *********************************************************************


// ----------------------------------------------------------------
//  ___             _   _            ___         _               _   _          
// | __|  _ _ _  __| |_(_)___ _ _   |   \ ___ __| |__ _ _ _ __ _| |_(_)___ _ _  
// | _| || | ' \/ _|  _| / _ \ ' \  | |) / -_) _| / _` | '_/ _` |  _| / _ \ ' \ 
// |_| \_,_|_||_\__|\__|_\___/_||_| |___/\___\__|_\__,_|_| \__,_|\__|_\___/_||_|
// ----------------------------------------------------------------

// Add "Tally Ballots" Button in "Election" in the spreadsheet
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Election')
      .addItem('Tally Ballots', 'tallyBallots')
      .addToUi();
}

// Finds the minimum of an array
// https://stackoverflow.com/questions/8934877/obtain-smallest-value-from-array-in-javascript
Array.min = function( array ){
    return Math.min.apply( Math, array );
};

var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
var formResponses = spreadsheet.getSheetByName("Form Responses 1")
var formResponsesData = spreadsheet.getSheetByName("Form Responses 1").getDataRange().getValues();

var electionInfo = spreadsheet.getSheetByName("Election Info");
var electionInfoData = spreadsheet.getSheetByName("Election Info").getDataRange().getValues();


// unique()
// This method takes inputs an array and outputs a new array of all the unique items from the initial array.
// https://stackoverflow.com/questions/1960473/get-all-unique-values-in-a-javascript-array-remove-duplicates
function unique(value, index, self) { 
  return self.indexOf(value) === index;
}

// cleanse_empty_votes()
// This function is used sparingly in the event that a voter's chosen list of candidates are all eliminated during the
// tallying process. This function is used to catch any empty lists in case in order to prevent any program errors.
function cleanse_empty_votes(input_votes){
  for (var vote in input_votes){
    if (input_votes[vote] === []){
        input_votes.splice(vote, 1);
    }
  }
}

// tranpose()
// switches the rows and columns of a two-dimensional array
// https://stackoverflow.com/questions/4492678/swap-rows-with-columns-transposition-of-a-matrix-in-javascript/13241545
function transpose(array){
    return Object.keys(array[0]).map(function(c) {
        return array.map(function(r) { return r[c]; });
    });
}

// gather_votes()
// This function turns a .csv file full of votes (as downloaded from a spreadsheet generated by a Google Form, e.g.) ...
// into a python list where each item represents a voter. Each voter is another list filled with the voters' chosen
// candidates in order.
function gather_votes(){
  
  // https://yagisanatode.com/2017/12/13/google-apps-script-iterating-through-ranges-in-sheets-the-right-and-wrong-way/
  var rangeData = formResponses.getDataRange();
  var lastRow = rangeData.getLastRow();
  
  var column_counter = 1;
  while (formResponses.getRange(1, column_counter).isBlank() == false){
    column_counter += 1;
  }
  
  var votes = [];
  
  // Iterate through the entire spreadsheet (there will most likely not be 1000 ballots, but for redundancy)
  for (var i = 1; i < 1000; i++){
    var tempArray = [];
    // So long as there is a vote in the current row, put the votes into the correctly formatted Array
    if (i < lastRow){
      for (var j = 1; j < column_counter-2; j++){
        tempArray.push(formResponsesData[i][j]);
      }

      votes.push(tempArray);
      
      // \/ Reference on how spreasheet scripts push data
      // https://www.w3schools.com/jsref/jsref_push.asp
    }
  }
  return votes;
}

// tally_votes()
// This function is used repeatedly throughout the function as a way to interpret the votes gathered using gather_votes()
// or otherwise modified throughout the program. It counts the number of instances in which a candidate is ranked first
// in a voter's choices and outputs the result as a list with each item being another list containing the candidate and
// his/her number of votes.
function tally_votes(list_of_candidates, input_list, reapportioned_list, list_of_secured_candidates){
  // initialize two temporary lists to be used in this function
  var output = [];
  var placeholder_list = [];
    
  // remove any exhausted votes
  for (var voter in input_list){
    try{
      if (list_of_candidates.indexOf(input_list[voter][0]) === -1){
        // https://love2dev.com/blog/javascript-remove-from-array/
        input_list.splice(voter, 1);
      }
    }
    
    catch(error){
    }
       
    try{
      if (list_of_secured_candidates.indexOf(input_list[voter][0]) !== -1){
        input_list.splice(voter, 1);
      }
    }
    
    catch(error){
    }
  }
  
  // for every candidate in the list provided...
  for (var candidate in list_of_candidates){
    // append the name of the candidate and a number (0) to a smaller list within the output
    placeholder_list.push(list_of_candidates[candidate]);
    placeholder_list.push(0);
    
    // if there are more instances of that candidate in the input, increase the tally for that candidate
    for (var vote in input_list){
      if ((input_list[vote][0] === list_of_candidates[candidate]) && (input_list[vote][0] !== "least")){
        placeholder_list[1] += 1;
      }
    }
      
    for (var reapportioned_candidate in reapportioned_list){
      if (reapportioned_list[reapportioned_candidate][0] === list_of_candidates[candidate]){
        placeholder_list[1] += reapportioned_list[reapportioned_candidate][1];
      }
    }
      
    // add the smaller list into the growing list of candidates and associated votes
    output.push(placeholder_list);
                  
    // reset the placeholder list
    placeholder_list = [];
  }
  return output;
}

// reapportion()
// This is the main function of the program. It takes the input of the gathered votes and tallies them appropriately
// according to RCV standards. It first eliminates the candidate with the lowest number of votes. Then it re-tallies the
// votes to include the elimination, adding the eliminated candidate(s)' next ranked choice. The second step is to check
// if a candidate has reached the appropriate threshold and, if so, reapportion the extra votes (if any) to their next
// choice candidates. This function is run in a loop until the desired number of candidates is reached.
function reapportion(votes, vote_threshold, secured_candidates, reapportioned_list, list_of_candidates){

  tallied_votes = tally_votes(list_of_candidates, votes, reapportioned_list, secured_candidates);
  tallied_list_to_fill = tallied_votes;

  // This if statement is a simplification step to reduce program time. If there are fewer than three candidates
  // remaining (i.e. two), then the complex reapportioning process does not need to take place, and the one with
  // the higher number of votes can simply be added to the chosen candidates and the other eliminated.
  if (tallied_votes.length > 3){
    
    cleanse_empty_votes(votes);
    
    tallied_votes = tally_votes(list_of_candidates, votes, reapportioned_list, secured_candidates);

    // STEP 1:
    // Eliminate the candidate with the lowest number of votes
    // (Note: if there is a tie for lowest ranked candidate, both are eliminated)
    // Reapportion the lowest-ranked candidate's voters' votes to their next choices.

    Logger.log("Tallied Votes: " + tallied_votes);
    voting_tallies = transpose(tallied_votes)[1];
    Logger.log("VTs");
    Logger.log(voting_tallies);

    // Main function of step one: if there is a candidate in the list of tallied votes that has reached or surpassed
    // the threshold, remove it from all the lists in which it may contribute to future tallies.
    for (var tallied_vote in tallied_votes){
      if (tallied_votes[tallied_vote][1] === Array.min(voting_tallies)){
        Logger.log("Eliminate Candidate <" + list_of_candidates[tallied_vote] + ">'s First Choice Votes");
        
        // remove from the running list of candidates
        list_of_candidates.splice((list_of_candidates.indexOf(tallied_votes[tallied_vote][0])), 1);
        
        Logger.log(list_of_candidates);
                
        Logger.log(tallied_votes);
        Logger.log(tallied_votes[tallied_vote[0]]);
                                 
        // remove the candidate from the growing list of vote tallies that have been reapportioned
        // i.e. remove the "exhausted" votes
        try{
          for (var candidate in reapportioned_list){
            if (reapportioned_list[candidate][0] === tallied_votes[tallied_vote][0]){
              reapportioned_list.splice(candidate, 1);
              Logger.log(tallied_votes[tallied_vote][0]);
              Logger.log(reapportioned_list);
            }
          }
        }
        
        catch(error){
          Logger.log("Candidate removed already");
          Logger.log(error);
        }
        
        // remove from the total votes list
        for (var voter in votes){
          // if the voter's first choice is the vote for the candidate that must be eliminated
          if (votes[voter][0] === tallied_votes[tallied_vote][0] && votes[voter][votes.length - 1] !== "least"){
            votes[voter].splice(0, 1);
            votes[voter].push("least");
          }
        }
        
        // remove from the tallied vote list
        tallied_votes.splice(tallied_vote, 1);
      }
    }
   
    Logger.log(reapportioned_list);

    // remove
    try{
      for (var candidate in reapportioned_list){
        // https://stackoverflow.com/questions/39669460/typeerror-cannot-find-function-includes-in-object
        if (secured_candidates.indexOf(reapportioned_list[candidate][0]) !== -1){
          reapportioned_list.splice(candidate, 1);
        }
      }
    }
    
    catch(error){
      Logger.log("Candidate already removed");
      Logger.log(error);
    }
    
    Logger.log(reapportioned_list);
      
    cleanse_empty_votes(votes)
      
    // re-tally the votes
    tallied_votes = tally_votes(list_of_candidates, votes, reapportioned_list, secured_candidates);
    
    Logger.log("Votes (with Removals) and Length: ");
    Logger.log(votes);
    Logger.log(votes.length);
    Logger.log("Tallied Votes (with Removals): ");
    Logger.log(tallied_votes);
    Logger.log("List of Candidates (with Removals): ");
    Logger.log(list_of_candidates);
      
    // STEP 2:
    // Check to see if a candidate has already reached the threshold.
    // If so, reapportion the extra votes to their voters' second choices.
    
    // if a candidate has already passed the threshold, reapportion the candidate's votes to the voters' next choices
    for (var candidate in tallied_votes){
      if (tallied_votes[candidate][1] >= vote_threshold){
        // add the candidate to the list of secured candidates
        secured_candidates.push(tallied_votes[candidate][0])
        Logger.log(candidate);
        
        // remove the candidate from the list of candidates
        list_of_candidates.splice(list_of_candidates.indexOf(tallied_votes[candidate][0]), 1);
        Logger.log(list_of_candidates);

        
        // calculate what fraction of the candidate's voters' votes need to be reapportioned
        fraction = ((tallied_votes[candidate][1] - vote_threshold) / tallied_votes[candidate][1]);
        Logger.log("Reapportion fraction: " + (tallied_votes[candidate][1] - vote_threshold) + "/" + tallied_votes[candidate][1]);
        
        // iterate through every vote ...
        for (var voter in votes){
          // if the current voter voted for the secured candidate as their first choice,
          // remove the secured candidate's vote from the growing tally
          if (votes[voter][0] === tallied_votes[candidate][0]){
            votes.splice(voter, 1);
            Logger.log(votes.length);
          }
                    
          //Logger.log(votes);
          cleanse_empty_votes(votes);
          //Logger.log(votes);
        }
          
        for (var voter in votes){
            
          for (var reapportioned_candidate in reapportioned_list){
            try{
              if (reapportioned_list[reapportioned_candidate][0] == votes[voter][0]){
                reapportioned_list[reapportioned_candidate][1] += fraction;
                // Logger.log(reapportioned_list)
              }
            }
            
            catch(error){
              Logger.log("candidate already eliminated!")
            }     
          }
        }
          
        tallied_votes[candidate][1] -= (tallied_votes[candidate][1] - vote_threshold)           
      }
    }
    
    cleanse_empty_votes(votes);
            
    tallied_votes = tally_votes(list_of_candidates, votes, reapportioned_list, secured_candidates);
            
    Logger.log("Votes (with Reapp) and Length: ")
    Logger.log(votes);
    Logger.log(votes.length);
    Logger.log("Tallied Votes (with Reapp): ");
    Logger.log(tallied_votes);
    Logger.log("List of Candidates (with Reapp): ")
    Logger.log(list_of_candidates);       
  }
  
  // (i.e. if there are only two candidates left)
  else{
    Logger.log("No More Reapportioning Necessary!");
    
    tallied_votes = tally_votes(list_of_candidates, votes, reapportioned_list, secured_candidates);

    if (tallied_votes[0][1] > tallied_votes[1][1]){
      secured_candidates.push(tallied_votes[0][0]);
    }
    
    else{
      secured_candidates.push(tallied_votes[1][0])
    }
  }
  
  // the final return: the list containing the secured candidates
  Logger.log("Secured Candidates: ");
  return secured_candidates
}

function tallyBallots(){

  // ----------------------------------------------------------------
  //  ___                                ___      _             
  // | _ \_ _ ___  __ _ _ _ __ _ _ __   / __| ___| |_ _  _ _ __ 
  // |  _/ '_/ _ \/ _` | '_/ _` | '  \  \__ \/ -_)  _| || | '_ \
  // |_| |_| \___/\__, |_| \__,_|_|_|_| |___/\___|\__|\_,_| .__/
  //              |___/                                   |_|   
  // ----------------------------------------------------------------
  
  // how many candidates do you want to win?
  CANDIDATES_TO_WIN = electionInfo.getRange(6, 2).getValues()[0][0];
  Logger.log("# of Candidates that will Win: ");
  Logger.log(CANDIDATES_TO_WIN);
  
  var VOTES = gather_votes();
  Logger.log("VOTES: ");
  Logger.log(VOTES);
  
  // Initialize a list that will contain all of the unique candidates
  // array concatenation found @ https://stackoverflow.com/questions/10865025/merge-flatten-an-array-of-arrays
  var LIST_OF_CANDIDATES = [].concat.apply([], VOTES).filter(unique).sort();
  var INITIAL_LIST_OF_CANDIDATES = [].concat.apply([], VOTES).filter(unique).sort();
  
  Logger.log("List of Candidates: ");
  Logger.log(LIST_OF_CANDIDATES);
  
  // Clear any data that may be in the way of the election data about to be tabulated and inserted
  electionInfo.getRange('D3:D1000').clearContent();
  electionInfo.getRange('E2:Z1000').clearContent();
  
  for (i = 0; i < LIST_OF_CANDIDATES.length; i++){
    electionInfo.getRange(2, (5 + i)).setValue(LIST_OF_CANDIDATES[i]);
    electionInfo.getRange(2, (5 + i)).setBackground("#f4cccc");
  }
  
  var number_of_votes_cast = VOTES.length;
  //Logger.log("NOVC: " + number_of_votes_cast + " CTW: " + CANDIDATES_TO_WIN);
  //Logger.log("DIV: " + number_of_votes_cast/(CANDIDATES_TO_WIN + 1));
  //Logger.log("FLR: " + Math.floor(number_of_votes_cast/(CANDIDATES_TO_WIN + 1)));
  
  var VOTE_THRESHOLD = 1 + Math.floor(number_of_votes_cast/(CANDIDATES_TO_WIN + 1))
  Logger.log("Vote Threshold: " + VOTE_THRESHOLD + " votes")
  
  // Initialize a list to be filled with the secured candidates as they are tabulated
  var SECURED_CANDIDATES = []
  
  var REAPPORTIONED_LIST = []
  
  for (var i = 0; i < LIST_OF_CANDIDATES.length; i++){
    REAPPORTIONED_LIST.push([LIST_OF_CANDIDATES[i], 0]);
  }
  
  // Logger.log(REAPPORTIONED_LIST);
  
  Logger.log("");
  
  // Initialize the round counter
  var round_counter = 1;
  
  var tally_list_to_fill = [];
  
  // tallied_votes = tally_votes(LIST_OF_CANDIDATES, VOTES, REAPPORTIONED_LIST, SECURED_CANDIDATES);
  
  // ----------------------------------------------------------------
  //  __  __      _        _                  
  // |  \/  |__ _(_)_ _   | |   ___  ___ _ __ 
  // | |\/| / _` | | ' \  | |__/ _ \/ _ \ '_ \
  // |_|  |_\__,_|_|_||_| |____\___/\___/ .__/
  //                                    |_|   
  // ----------------------------------------------------------------

  // i.e. while there are more than the chosen number of candidates left
  while (SECURED_CANDIDATES.length < CANDIDATES_TO_WIN){
    
    // print a tally displaying the number of rounds elapsed
    Logger.log("Current Round: ");
    Logger.log(round_counter);
    electionInfo.getRange(2 + round_counter, 4).setValue("Round " + round_counter);
    electionInfo.getRange(2 + round_counter, 4).setBackground("#c9daf8");
    
    // perform the "reapportion" function on the input of tallied votes (In an [A, 4], [B, 2], etc. format)
    Logger.log("Secured Candidates: ");
    Logger.log(reapportion(VOTES, VOTE_THRESHOLD, SECURED_CANDIDATES, REAPPORTIONED_LIST, LIST_OF_CANDIDATES));
    
    Logger.log(tallied_list_to_fill);
    Logger.log(INITIAL_LIST_OF_CANDIDATES);
    Logger.log(INITIAL_LIST_OF_CANDIDATES.length);
    
    for (var column = 5; column <= (5 + INITIAL_LIST_OF_CANDIDATES.length); column++){
      for (var candidate in tallied_list_to_fill){
        if (electionInfo.getRange(2, column).getValues()[0][0] === tallied_list_to_fill[candidate][0]){
          electionInfo.getRange(2 + round_counter, column).setValue(tallied_list_to_fill[candidate][1]);
          electionInfo.getRange(2 + round_counter, column).setBackground("#c9daf8");
        } 
        else{
        }
      }
    }
    
    // print a space between rounds and iterate the round counter
    Logger.log("");
        
    round_counter += 1;
  }
  
  for (i = 0; i < SECURED_CANDIDATES.length; i++){
    electionInfo.getRange(8 + i, 2).setValue(SECURED_CANDIDATES[i]);
    electionInfo.getRange(8 + i, 2).setBackground("#f8e111");
  }
}
