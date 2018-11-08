var express = require('express');

var cors = require('cors')
var bodyParser = require("body-parser");
var app = express();

app.use(cors());
//Here we are configuring express to use body-parser as middle-ware.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var admin = require("firebase-admin");

var serviceAccount = "key.json"; //removed private data

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount), //removed private data
    databaseURL: "" //removed private data
});

const Nexmo = require('nexmo');
const nexmo = new Nexmo({
    apiKey: "", //removed private data
    apiSecret: "" //removed private data
});

var msgRef = admin.database().ref("messageQueue");

msgRef.on('child_added', (data) => {
    console.log(data.val());
});
msgRef.on('child_changed', (data) => {
    console.log(data.val());
});

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
    response.render('pages/index');
});

app.get('/testmsg', (req, res) => {

    nexmo.message.sendSms(
        'fromsms', 'tosms', 'this is a test message', //removed private data
        (err, responseData) => {
            if (err) {
                console.log(err);
            } else {
                console.dir(responseData);
            }
        }
    );

    res.status(200).end();
})

app.post('/sendsms', function(request, res) {

    console.log(request.body);

    var id = request.body.lightId;
    var idToken = request.body.token;
    var lightSms = request.body.lightSms;
    var command = request.body.command;

    admin.auth().verifyIdToken(idToken)
        .then((decodedToken) => {
            var uid = decodedToken.uid;

            var message = id + command;

            nexmo.message.sendSms(
                'fromsms', lightSms, message, //removed private data
                (err, responseData) => {
                    if (err) {
                        console.log(err);

                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify({ a: true }));
                    } else {
                        console.log(responseData);

                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify({ a: false }));
                    }
                }
            );
            // ...
        }).catch((error) => {

            console.log(err);

            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ a: true }));

        });

});

app.get('/inbound', (req, res) => {
    if (!req.query.to || !req.query.msisdn) {
        console.log('This is not a valid inbound SMS message!');
    } else {
        if (req.query.concat) {
            console.log('Fail: the message is too long.');
            console.log(req.query);
        } else {

            console.log('Success');
            var incomingData = {
                messageId: req.query.messageId,
                from: req.query.msisdn,
                message: req.query.text,
                timestamp: req.query['message-timestamp']
            };

            var messages = incomingData['message'].split("X");

            messages.forEach((message) => {

                var arr = message.split("_");

                console.log(message);
                console.log(arr);

                if (arr.length > 6) {
                    var obj = {};
                    obj['lightId'] = arr[0];
                    obj['brightness'] = arr[1];
                    obj['moisture'] = arr[2];
                    obj['raining'] = arr[3];
                    obj['temp'] = arr[4];
                    obj['tempf'] = arr[5];
                    obj['pressure'] = arr[6];
                    obj['humidity'] = arr[7];

                    incomingData['message'] = obj;
                    if(obj['lightId'].includes("aaa00"))
                    {
                        console.log("_______________SAVED TO FIREBASE_________________");
                    var finalreff = admin.database().ref("weatherData/" + obj['lightId'] + "/" + incomingData.messageId).set(incomingData);
                    var finalreff = admin.database().ref("lights/" + obj['lightId'] + "/currentWeather").set(obj);
                
                    }
                }

                console.log(incomingData);
            });
        }
        res.status(200).end();
    }
});

app.get('/testsave', (req, res) => {
    /**/

    console.log('Success');
    var incomingData = {
        messageId: "testiD",
        from: "2286710743",
        message: "aaa001_872_1023_0_24.32_1007.67_44.00_Xaaa002_869_1023_0_24.52_29.77_46.00_",
        timestamp: "rightMeow"
    };

    var messages = incomingData['message'].split("X");

    messages.forEach((message) => {

        var arr = message.split("_");

        console.log(arr);

        if (arr.length > 5) {
            var obj = {};
            obj['lightId'] = arr[0];
            obj['brightness'] = arr[1];
            obj['moisture'] = arr[2];
            obj['raining'] = arr[3];
            obj['temp'] = arr[4];
            obj['pressure'] = arr[5];
            obj['humidity'] = arr[6];

            incomingData['message'] = obj;
            var finalreff = admin.database().ref("weatherData/" + obj['lightId'] + "/" + incomingData.messageId).set(incomingData);
            var finalreff = admin.database().ref("lights/" + obj['lightId'] + "/currentWeather").set(obj);
        }
    });

    console.log(incomingData);
    // }
    //}
    res.status(200).end();
});

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});
