global.register(function (comvarSet) {
    var warrior = {
        justComvarValue : "00000000000000000000000000000000",
        isEveryOneOurs : function () {
            var length = comvarSet.length,
                index;
            for (index = 0; index < length; index += 1) {
                if (typeof comvarSet === 'number') {
                    return false;
                }
            }
            return true;
        },
        getRandomItemFromArray : function (array) {
            var index = parseInt(Math.random() * array.length, 10);
            return array[index];
        },
        getRamdomShootToEnemy : function () {
            var enemyIndexes = [],
                length = comvarSet.length,
                index;
            for (index = 0; index < length; index += 1) {
                if (typeof comvarSet[index] === 'number' && index !== 4) {
                    enemyIndexes.push(index);
                }
            }
            return this.getRandomItemFromArray(enemyIndexes);
        },
        shoot : function (comvarSet) {
            var shoot1,
                result;

            if (this.isEveryOneOurs()) {
                shoot1 = parseInt(Math.random() * 8, 10);
                if (shoot1 === 4) {
                    shoot1++;
                }
            } else {
                shoot1 = this.getRamdomShootToEnemy();
            }

            result = [shoot1, shoot1, shoot1, this.justComvarValue];
            return result;
        }
    };
    return warrior.shoot(comvarSet);
}, "chaos");