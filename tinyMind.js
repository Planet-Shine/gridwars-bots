global.register(function (comvarSet) {
    var warrior = {
        justComvarValue : "00000000000000000000000000000000",
        shoot : function (comvarSet) {
            var shoot1 = parseInt(Math.random() * 8, 10),
                result;

            if (shoot1 === 4) {
                shoot1++;
            }

            result = [shoot1, shoot1, shoot1, this.justComvarValue];
            return result;
        }
    };
    return warrior.shoot(comvarSet);
}, "tinyMind");