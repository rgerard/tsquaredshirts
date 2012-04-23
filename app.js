var
    express = require('express'),
    app = express.createServer(),
    oauth = require('oauth'),

    twitterConsumerKey = "SxTj9KvwOvZo0kFo94DxA",
    twitterConsumerSecret = "szUAGcn1PbMfAjuiRZQGuSLnOr8A8r11s7VcSSDAg",
    twitterRequestTokenUrl = "https://api.twitter.com/oauth/request_token",
    twitterAccessTokenUrl = "https://api.twitter.com/oauth/access_token",
    twitterAuthorizeUrl = "https://api.twitter.com/oauth/authorize",

    twitoauth = new oauth.OAuth(
        twitterRequestTokenUrl,
        twitterAccessTokenUrl,
        twitterConsumerKey,
        twitterConsumerSecret,
        "1.0A",
        "http://www.tsquaredshirts.com/twitterauth",
        "HMAC-SHA1");

// Configuration
app.configure(function(){
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.set('view options', {
        layout: false
    });
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({ secret: "tsquared", cookie: { maxAge: 31557600000 } }));
    app.use(express.methodOverride());
    app.use(express.logger());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
});

app.dynamicHelpers({
    session: function(req, res){
        return req.session;
    }
});

app.listen(3000);

app.get('/*', function(req, res, next) {
  if (req.headers.host.match(/^www/) === null ) {
    res.redirect('http://www.' + req.headers.host + req.url);
  } else {
    next();     
  }
});

app.get('/', function(req, res){
  res.render('index');
});

app.get('/connect', function(req, res){
    if(req.session.oauthAccessToken && req.session.oauthAccessTokenSecret) {
        res.redirect('/favorites');
    } else {
        twitoauth.getOAuthRequestToken(function(error, oauthToken, oauthTokenSecret, results){
            if (error) {
                res.send("Error getting OAuth request token : " + sys.inspect(error), 500);
            } else {
                req.session.oauthRequestToken = oauthToken;
                req.session.oauthRequestTokenSecret = oauthTokenSecret;

                res.redirect(twitterAuthorizeUrl + "?oauth_token=" + req.session.oauthRequestToken);
            }
        });
    }
});

app.get('/twitterauth', function(req, res){
    twitoauth.getOAuthAccessToken(req.session.oauthRequestToken, req.session.oauthRequestTokenSecret, req.query.oauth_verifier, function(error, oauthAccessToken, oauthAccessTokenSecret, results) {
        if (error) {
            res.send("Error getting OAuth access token : " + error.message + "[" + oauthAccessToken + "]" + "[" + oauthAccessTokenSecret + "]" + "["+ results + "]", 500);
        } else {
            req.session.oauthAccessToken = oauthAccessToken;
            req.session.oauthAccessTokenSecret = oauthAccessTokenSecret;

            res.redirect('/favorites');
        }
    });
});

app.get('/favorites', function(req, res){
    if(!req.session.oauthAccessToken || !req.session.oauthAccessTokenSecret) {
        res.redirect('/connect');
    } else {
        // Right here is where we would write out some nice user stuff
        twitoauth.get("http://api.twitter.com/1/favorites.json", req.session.oauthAccessToken, req.session.oauthAccessTokenSecret, function (error, data, response) {
            if (error) {
                res.send("Error getting twitter favorites : " + error, 500);
            } else {
                var jsonResp = JSON.parse(data);
                res.render('favorites', { data:jsonResp } );
            }
        });
    }
});

app.get('/about', function(req, res){
    res.render('contact');
});

app.get('/contact', function(req, res){
    res.render('contact');
});

app.get('/popular', function(req, res){
    var favoriteTweets = [
        { text:"Don't focus on the one guy who hates you. You don't go to the park and set your picnic down next to the only pile of dog shit.",
          user : {
            screen_name : 'shitmydadsays'
          }
        },
        { text:"I'm sorry Taylor.",
            user : {
                screen_name : 'kanyewest'
            }
        },
        { text:"I'm beautiful in my way, 'cause God makes no mistakes. I'm on the right track, baby. I was Born This Way.",
            user : {
                screen_name : 'ladygaga'
            }
        },
        { text:"Never be afraid to dream.",
            user : {
                screen_name : 'ladygaga'
            }
        },
        { text:"Just noticed Twitter keeps prompting me to 'Add a location to your tweets'. Not falling for that one.",
            user : {
                screen_name : 'alqaeda'
            }
        },
        { text:"Aaaaaaahhhhhhmmmmm baaaaakkkkkkkkkk!",
            user : {
                screen_name : 'liltunechi'
            }
        },
        { text:"We always ignore the ones who adore us, and adore the ones who ignore us.",
            user : {
                screen_name : 'drakkardnoir'
            }
        },
        { text:"In honor of oil-soaked birds, 'tweets' are now called 'gurgles'.",
            user : {
                screen_name : 'StephenAtHome'
            }
        },
        { text:"Yes we can.",
            user : {
                screen_name : 'BarackObama'
            }
        }
    ];

    res.render('favorites', { data:favoriteTweets } );
});

app.get('/support', function(req, res){
    res.render('contact');
});
