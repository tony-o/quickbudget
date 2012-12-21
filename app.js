var express = require("express");
var passport = require("passport");
var localstrat = require("passport-local").Strategy;
var lily = require("./lily");
var config = require("./config");
var app = express();

passport.serializeUser(function(u,d){d(null,u);});
passport.deserializeUser(function(u,d){d(null,u);});

passport.use(new localstrat(
  function(user,pass,d){
    process.nextTick(function(){
      lily.findUser(user,function(e,u){
        if(e){return d(e);}
        if(!u){return d(401,null);}
        if(!lily.comparePasswords(u.password,pass)){return d(401,null);}
        return d(null,u);
      });
    });
  }
));

app.configure(function(){
  //app.use(express.logger());
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session({secret:config.secret}));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(__dirname+"/static"));
});

app.post("/login",passport.authenticate("local",{failureRedirect:null,failureFlash:false}),function(q,s){
  s.redirect("/index.htm");
});

app.post("/register",function(q,s){
  lily.addUser(q.body,function(e,u){
    console.error(e);
    console.log(u);
    if(e){
      s.send(500);
    }else{
      s.send(201);
    }
  });  
});

app.post("/savecat",function(q,s){
  q.body.username = q.user.username;
  lily.addCategory(q.body,function(e,u){
    console.log(u);
  });
});

app.post("/saveexp",function(q,s){
  q.body.username = q.user.username;
  lily.addExpense(q.body,function(e,u){
    console.log(u);
  });
});
app.get("/",function(q,s){
  s.redirect("/login.htm");
});
app.get("/main",function(q,s){
  lily.getCategories(q.user.username,function(e,i){
    s.end(JSON.stringify({"data":i}));
  });
});
app.get("/getexp",function(q,s){
  lily.getExpenses(q.user.username,function(e,i){
    s.end(JSON.stringify({"data":i}));
  });
});
app.get("/index.htm",function(q,s,n){
  if(q.isAuthenticated()){ return n(); }
  s.redirect("/login.htm");  
});
app.listen(3000);
