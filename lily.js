var mongoose = require("mongoose");
var crypto = require("crypto");
mongoose.connect(process.env.DB || require("./config").db);

var schemas = {};

schemas.user = mongoose.model("user",mongoose.Schema({
  "username":"string"
  ,"password":"string"
}));

schemas.category = mongoose.model("category",mongoose.Schema({
  "username":"string"
  ,"name":"string"
  ,"value":"number"
}));

schemas.expense = mongoose.model("expenses",mongoose.Schema({
  "username":"string"
  ,"category":"string"
  ,"value":"number"
  ,"period":"string"
}));

var pass = function(password){
  var shasum = crypto.createHash("sha1");
  shasum.update(password+"::"+(process.env.SALT || require("./config").salt));
  return shasum.digest("hex");
};

var period = function(){
  var d = new Date();
  return d.getFullYear() + ">" + d.getMonth();
};

module.exports = {
  findUser:function(username,c){
    schemas.user.findOne({username:username},"id username password",function(err,user){
      c(err,user);
    });
  }
  ,addUser:function(data,c){
    schemas.user.findOne({username:data.username},"username",function(err,user){
      if(user || err){
        c(err || user, null);
        return;
      }
      var user = new schemas.user({username:data.username,password:pass(data.password)});
      user.save(function(e,u){
        if(e){ console.log( e ) ; } 
        c(e,u);
      });
    });
  }
  ,addCategory:function(data,c){
    var n = new schemas.category(data);
    n.save(c);
  }
  ,removeCategory:function(data,c){
    console.log("removing:" + JSON.stringify(data));
    schemas.category.find({username:data.username,name:data.name},function(e,d){
      var o = d.length;
      console.log("size:" + o);
      var p = function(){
        o--;
        if(o == 0){
          c();
        }
      };
      for(var i in d){
        d[i].remove(p);
      }
    });
  }
  ,editCategory:function(data,c){
    schemas.category.find({username:data.username,name:data.oldname},function(e,d){
      for(var i in d){
        (function(d,a){
          console.log(a);
          d.name = data.newname;
          d.value = data.value;
          var f = null;
          if(a){ 
            f = function(){
              schemas.expense.find({username:data.user,category:data.oldname},function(e,d){
                for(var i in d){
                  (function(d,a){
                    d.category = data.newname;
                    var f = null;
                    if(a){
                      f = function(){c();};
                    }
                    d.save(f);
                  })(d[i],i == d.length-1);
                }
                if(d.length == 0){ 
                  c(); 
                }
              });
            };
          }
          d.save(f);
        })(d[i], i == d.length-1);
      }
      if(d.length == 0){
        c();
      }
    });
  }
  ,addExpense:function(data,c){
    data.period = period();
    var n = new schemas.expense(data);
    n.save(c);
  }
  ,getExpenses:function(user,c){
    schemas.expense.find({username:user,period:period()},function(e2,exps){
      c(e2,exps);
    });
  }
  ,getCategories:function(user,c){
    schemas.category.find({username:user},function(e1,cats){
      schemas.expense.find({username:user,period:period()},function(e2,exps){
        var result = [];
        var rcat = {};
        for(var c4 in cats){ rcat[cats[c4].name] = cats[c4].value; }
        for(var l in exps){
          if(rcat[exps[l].category]){
            rcat[exps[l].category] -= exps[l].value;
          }  
        }
        for(var jj in rcat){ result.push({name:jj,v:rcat[jj]}); }
        result.sort();
        c(null,result);
      });
    });
  }
  ,comparePasswords:function(pass1,pass2){ return pass1 == pass(pass2) || pass1 == pass2; }
};
