global.register(function (comvarSet) {
    var warrior = {
        justComvarValue : "00000000000000000000000000000000",
        countOfEnemies : null,
        enemyIndexes : null,
        revertIndexes : function (indexes) {
            var resultIndexes = [],
                length = comvarSet.length,
                index;
            for (index = 0; index < length; index += 1) {
                if (resultIndexes.indexOf(index) === -1 && index !== 4) {
                    resultIndexes.push(index);
                }
            }
            return resultIndexes;
        },
        getLess5EnemiesResult : function () {
            var targetIndexes = [].concat(this.enemyIndexes),
                shoot1,
                shoot2,
                shoot3;

            shoot1 = this.getRandomItemFromArray(targetIndexes);
            targetIndexes.splice(targetIndexes.indexOf(shoot1), 1);

            if (!targetIndexes.length) {
                targetIndexes = this.revertIndexes(targetIndexes);
            }

            shoot2 = this.getRandomItemFromArray(targetIndexes);
            targetIndexes.splice(targetIndexes.indexOf(shoot2), 1);

            if (!targetIndexes.length) {
                targetIndexes = this.revertIndexes(targetIndexes);
            }

            shoot3 = this.getRandomItemFromArray(targetIndexes);

            return [shoot1, shoot2, shoot3, this.justComvarValue];
        },
        getMore5EnemiesResult : function () {
            var shoot1 = this.getRandomShootToEnemy();
            return [shoot1, shoot1, shoot1, this.justComvarValue];
        },
        initialize : function () {
            var enemyIndexes    = this.getEnemyIndexes();
            this.enemyIndexes   = enemyIndexes;
            this.countOfEnemies = enemyIndexes.length;
        },
        isEveryOneOurs : function () {
            return this.countOfEnemies === 0;
        },
        getRandomItemFromArray : function (array) {
            var index = parseInt(Math.random() * array.length, 10);
            return array[index];
        },
        getEnemyIndexes : function () {
            var enemyIndexes = [],
                length = comvarSet.length,
                index;
            for (index = 0; index < length; index += 1) {
                if (typeof comvarSet[index] === 'number' && index !== 4) {
                    enemyIndexes.push(index);
                }
            }
            return enemyIndexes;
        },
        getRandomShootToEnemy : function () {
            return this.getRandomItemFromArray(this.enemyIndexes);
        },
        getRandomShoot : function () {
            var shoot1 = parseInt(Math.random() * 8, 10);
            if (shoot1 === 4) {
                shoot1++;
            }
            return shoot1;
        },
        shoot : function (comvarSet) {
            var result;
            this.initialize();
            if (this.isEveryOneOurs()) {
                result = [
                    this.getRandomShoot(),
                    this.getRandomShoot(),
                    this.getRandomShoot(),
                    this.justComvarValue
                ];
            } else {
                if (this.countOfEnemies < 5) {
                    result = this.getLess5EnemiesResult();
                } else {
                    result = this.getMore5EnemiesResult();
                }
            }
            return result;
        }
    };
    return warrior.shoot(comvarSet);
}, "wind");