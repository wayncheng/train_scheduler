/*===========================================================
------------------------------------------------------------*/

  // Initialize Firebase
  var config = {
    apiKey: "AIzaSyDEAlg2AMWxUJ1vy2Sgv3mQRoGgKmmlMsY",
    authDomain: "train-scheduler-5e8a3.firebaseapp.com",
    databaseURL: "https://train-scheduler-5e8a3.firebaseio.com",
    projectId: "train-scheduler-5e8a3",
    storageBucket: "train-scheduler-5e8a3.appspot.com",
    messagingSenderId: "551809886007"
  };
  firebase.initializeApp(config);
  var database = firebase.database();


// Add schedule to firebase
$('#submit').on('click', function(event){
    event.preventDefault();

    var name = $('#train').val().trim();
    var destination = $('#destination').val().trim();
    var start = $('#first-time').val().trim();
    var freq = parseInt($('#freq').val().trim());

    var newTrain = {
        name: name,
        destination: destination,
        start: start,
        freq: freq
    };

    database.ref('/schedules').push(newTrain);

    console.log('name',name);
    console.log('destination',destination);
    console.log('time',start);
    console.log('freq',freq);

    $('#train').val('');
    $('#destination').val('');
    $('#first-time').val('');
    $('#freq').val('');
})


var intervalometer = setInterval(update, 60000);

database.ref('/schedules').on('value', function(snapshot){

    // Clear current results
    $('.canvas-space tbody').empty();

    snapshot.forEach(function(childSnapshot){
        var fireID = childSnapshot.key;
        var trainData = childSnapshot.val();

        var name = trainData.name;
        var destination = trainData.destination;
        var start = trainData.start;
        var freq = trainData.freq;

        printNewTrain(fireID,name,destination,start,freq);
    });
});
    
// Write new schedule to the table
database.ref('/schedules').on('child_added',function(childSnapshot, prevChildKey){
    console.log('childSnapshot.val()',childSnapshot.val());

    var csv = childSnapshot.val(); 
    
    var name = csv.name;
    var destination = csv.destination;
    var start = csv.start;
    var freq = csv.freq;

    var timeData = calculateTime(start,freq);
    console.log('timeData',timeData);
    var arrivalTime = timeData.arrivalTime;
    var timeAway = timeData.timeAway;
});


function calculateTime(start,freq){
    var arrivalTime, timeAway, arrivalTime24hr;
    var now = moment();
    var startTime = moment(start, 'HH:mm');
    var timePassed = now.diff(moment(startTime), "minutes");

        
    if ( timePassed < 0 ) {
       arrivalTime24hr = start;
       timeAway = timePassed * (-1);
    }
    else {
        // number of minutes until train arrives
        timeAway = freq - (timePassed % freq); 

        // Calculate actual time with moment.js
        arrivalTime24hr = now.add(timeAway, 'minutes');
    }

    arrivalTime = moment(arrivalTime24hr, 'H:mm').format('h:mm a');

    var timeData = {
        'timeAway': timeAway,
        'arrivalTime': arrivalTime
    };
    // console.log('timeData',timeData);

    return timeData;
}

function printNewTrain(fireID,name,destination,start,freq){
    var timeData = calculateTime(start,freq);
    console.log('timeData',timeData);

    var tr = $('<tr>').attr('id',fireID);
    var td1 = $('<td>').text(name);
    var td2 = $('<td>').text(destination);
    var td3 = $('<td>').text(freq);
    var td4 = $('<td>').text(timeData.arrivalTime);
    var td5 = $('<td>').text(timeData.timeAway);

    tr.append(td1).append(td2).append(td3).append(td4).append(td5);
    $('tbody').append(tr);

};

// Update the schedule every minute
function update(){
    console.log('update() start');
    database.ref('/schedules').once('value')
        .then(function(snapshot){
            snapshot.forEach(function(childSnapshot){
                // childSnapshot.key would be the unique id generated by push
                var trainData = childSnapshot.val();
                var timeData = calculateTime(trainData.start,trainData.freq);
                var fireID = trainData.fireID;

                $(fireID).children('td:nth-child(4)').text(timeData.arrivalTime);
                $(fireID).children('td:nth-child(5)').text(timeData.timeAway);
                
                // // Find target table row
                // $('#schedule-target tbody tr').each(function(){
                //     // Look for train name in first column
                //     var rowName = $(this).children('td:first-child').text();
                //     // When match is found...
                //     if ( rowName === name ) {
                //         $(this).children('td:nth-child(4)').text(timeData.arrivalTime);
                //         $(this).children('td:nth-child(5)').text(timeData.timeAway);
                //     }
                // })
            })
        })
    console.log('update() end');
} ////////////////////// end update()

update();