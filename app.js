
let express = require('express');
let jwt = require('jsonwebtoken');
let { movies, users,bookings} = require('./data.js');

let passport = require('passport');
let JwtStrategy = require('passport-jwt').Strategy;
let ExtractJWT = require('passport-jwt').ExtractJwt;


let app = express();

app.use(express.json());
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "movieswebapp.web.app");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept,  authorization"
    );
    res.header("Access-Control-Allow-Methods", "GET,POST,DELETE,PUT,OPTIONS");
    next();
});


const port = 5005;




app.use(passport.initialize());





app.listen(port, () => console.log(`Server is listening on port ${port}`));

const params = {
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: 'jwtsecret5634278'
};

const jwtExpirySeconds = 30000;

let strategyAll = new JwtStrategy(params,function (token, done) {  
  let user = users.find((a) => a.id === token.id);
    if (!user) {
        return done(null, false, { message: 'Incorrect username or password' });
    } else {
          
        return done(null, user);
    }
});


passport.use('roleAll',strategyAll);


app.post('/user', function (req, res) {
    let email = req.body.email;
    let password = req.body.password;
    let user = users.find((a) => a.email === email && a.password === password);
    if (user) {
        let payload = { id: user.id};
        let token = jwt.sign(payload, params.secretOrKey, {
            algorithm: 'HS256',
            expiresIn: jwtExpirySeconds,
        });
        res.send({token:"bearer "+token,user:user});
    } else
        res.status(404).send('Login Failed');
});
app.get('/user', passport.authenticate('roleAll',{ session: false }), function (req, res) {
    res.send(req.user);
});
app.get('/movies/:city', (req,res) => {
    let { city } = req.params;
    //console.log(city);
    let { q, lang, format, genre } = req.query;
    let movie = movies.filter((a) => {
        let find = a.theaters.find((b) => b.city === city);
        if (find) {
            return a;
        }
    });
    let arr = movie;
    if (q){
        let movies = arr.filter((a) => a.title === q);
        arr = movies;
    }
    if (genre) {
        let langArr = genre.split(',');
        let movies = arr.filter((a) => langArr.includes(a.genre));
         arr = movies;
    }
    if (lang) {
        let langArr = lang.split(',');
        let movies = arr.filter((a) => langArr.includes(a.language));
         arr = movies;
    }
    if (format) {
        let langArr = format.split(',');
        let movies = arr.filter((a) => langArr.includes(a.format));
         arr = movies;
    }
     //console.log(arr);
    res.json(arr);
})
app.get('/movie/:id', (req, res) => {
    let { id } = req.params;
    let { price,time } = req.query;
    let movie = movies.find((a) => a.id === +id);
    if (movie) {
        res.json(movie);
    } else {
        res.status(401).send('Could Not find movie');
    }
})
app.get('/bookings', (req, res) => {
    res.send(bookings);
})
app.post('/seats', (req, res) => {
    let seat = req.body;
    if (bookings.length === 0) {
        bookings.push({ ...seat, id: 1 });
    } else {
        let maxId = bookings.reduce((acc, curr) => {
            if (acc > curr.id) return acc;
            else return curr.id;
        }, 0);
         bookings.push({ ...seat, id: maxId });
    }
      const movieIndex = movies.findIndex((m) => m.title === seat.title);

    if (movieIndex !== -1) {
      const theaterIndex = movies[movieIndex].theaters.findIndex((t) => t.name === seat.movieHall);

      if (theaterIndex !== -1) {
        const newSeat = { [seat.time]: seat.tickets };
        movies[movieIndex].theaters[theaterIndex].seats = { ...movies[movieIndex].theaters[theaterIndex].seats, ...newSeat };
        res.status(200).json({ success: true, message: 'Seat added successfully!' });
      } else {
        res.status(404).json({ success: false, message: 'Theater not found.' });
      }
    } else {
      res.status(404).json({ success: false, message: 'Movie not found.' });
    }
})
app.post('/edit', (req, res) => {
    let nuser = req.body;
    let ind = users.findIndex((a) => a.email === nuser.email);
    if (ind >= 0) {
        nuser.password = users[ind].password;
        users[ind] = nuser;
        res.json(nuser);
        
    } else {
        res.status(401).send('User Not Found');
    }
})
