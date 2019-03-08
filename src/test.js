let x = "top level x";
function foo3(p){
   var x = "in foo3";
   if(p){
       console.log("p is true and x is:", x);
   }else{
       console.log("p was false and x is:", x);
       for(var x = 0; x < 3; x++){
           console.log(x);
       }
       console.log("after for-loop", x);
   }
   console.log("before return:", x);
}
foo3("");
console.log(x);