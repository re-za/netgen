(function(namespace) {

  var __ = namespace,
      _p = __.config.population;

  
  var makePopulation = function() {

    var actors = [];
    var actorProto = {

      init: function(id) {
        var o = this;

        o.objType = "Actor";
        o.id = id;
        o.index = id;
        o.foci = [];
        o.contacts = [];
        o.alpha = 0;

        return o;

      },
      drawO: function() {
        var o = this;

        o.alpha = __.Rand.randUniform(0, Math.PI/2)
        //o.alpha = __Rand.randItem([0, Math.PI/2])
        // var pCycle = 12;
        // var oCycle = __.Net.cycle;
        // var oModHP = oCycle % (pCycle/2);
        // var oModFP = oCycle % pCycle;
        // var avgO = Math.PI * (oModFP < pCycle ? oModHP / (pCycle) : (1/2 - oModHP/pCycle));
        // var stdO = Math.PI/4;
        // var alpha = __.Rand.randNormal(avgO, stdO);
        //
        // o.alpha = alpha < 0 ? 0 : alpha > Math.PI/2 ? Math.PI/2 : alpha

        o.O = __u.makeVector([
          Math.cos(o.alpha),
          Math.sin(o.alpha)
        ]);

        return o.O
      },

    };

    function init() {
      for (var i = 0; i < _p.size; i++) {
        actors[i] = Object.create(actorProto).init(i)
      };
    };
    function outputPerPeriod() {
      return actors.map(function(actor){
        return {
          time: __.Sim.time(),
          actor: actor.id,
          alpha: (actor.alpha/Math.PI).toFixed(2) + ' &pi;'
        };
      });
    };

    //initialize
    init();

    //PUBLIC
    return {
      actors,
      outputPerPeriod,
    };

  };


  __.factories.makePopulation = makePopulation;


})(this.__ME__);
