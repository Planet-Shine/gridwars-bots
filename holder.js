global.register(function (comvarSet) {
    var warrior = {
        justComvarValue       : "00000000000000000000000000000000",
        ownComvar             : null,
        enemyIndexes          : null,
        emptyIndexes          : null,
        oursIndexes           : null,
        frontIndexes          : null,
        frontIndexesNearEnemy : null,
        shoot1                : null,
        shoot2                : null,
        shoot3                : null,
        fillArray             : [0,1,2,5,8,7,6,3],
        neighborSheet         : {
            0 : [1,3],
            1 : [0,2],
            2 : [1,5],
            3 : [0,6],
            5 : [2,8],
            6 : [3,7],
            7 : [6,8],
            8 : [5,7]
        },
        getEmptyFillIndex : function () {
            var length = this.fillArray.length,
                index,
                targetIndex;
            for (index = 0; index < length; index += 1) {
                targetIndex = this.fillArray[index];
                if (comvarSet[targetIndex] === 0) {
                    return targetIndex;
                }
            }
            return 0;
        },
        getNeighborIndexes    : function (index) {
            return [].concat(this.neighborSheet[String(index)]);
        },
        isNearEnemy : function (index) {
            var neighbors = this.getNeighborIndexes(index),
                neighbor1 = comvarSet[neighbors[0]],
                neighbor2 = comvarSet[neighbors[1]];
            return (typeof neighbor1 === 'number' &&
                neighbor1 !== 0) ||
                (typeof neighbor2 === 'number' &&
                neighbor2 !== 0);
        },
        getBit : function (tempBool) {
            return tempBool ? '1' : '0';
        },
        culcNewOwnComvar : function () {
            var result,
                isEnemyNear,
                isNotNew = true;

            isEnemyNear = !!this.enemyIndexes.length;
            result      = this.getBit(isNotNew) + this.getBit(isEnemyNear);
            this.ownComvar = result + this.justComvarValue.slice(2);
        },
        initialize : function () {
            var enemyIndexes          = [],
                emptyIndexes          = [],
                oursIndexes           = [],
                frontIndexes          = [],
                frontIndexesNearEnemy = [],
                length                = comvarSet.length,
                index;

            for (index = 0; index < length; index += 1) {
                if (index !== 4) {
                    if (typeof comvarSet[index] === 'number' &&
                            comvarSet[index] !== 0) {
                        enemyIndexes.push(index);
                        if (this.isNearEnemy(index)) {
                            frontIndexesNearEnemy.push(index);
                        }
                    } else if (comvarSet[index] === 0) {
                        emptyIndexes.push(index);
                    } else {
                        if (comvarSet[index].slice(0, 2) === '11' ||
                                comvarSet[index].slice(0, 2) === '00') {
                            frontIndexes.push(index);
                        }
                        oursIndexes.push(index);
                    }
                }
            }

            this.enemyIndexes          = enemyIndexes;
            this.emptyIndexes          = emptyIndexes;
            this.oursIndexes           = oursIndexes;
            this.frontIndexes          = frontIndexes;
            this.frontIndexesNearEnemy = frontIndexesNearEnemy;
        },
        getRandomItemFromArray : function (array) {
            var index = parseInt(Math.random() * array.length, 10);
            return array[index];
        },
        shoot : function (comvarSet) {
            this.initialize();

            // Если фронт рядом, а врагов нет и пустых мало, помогай фронту.
            if (this.frontIndexes.length &&
                    !this.enemyIndexes.length &&
                    this.emptyIndexes.length < 3) {
                this.shoot1 = this.shoot2 = this.getRandomItemFromArray(this.frontIndexes);
                this.shoot3 = this.getRandomItemFromArray(this.frontIndexes);
            // Заполняй пустые.
            } else if ((!this.enemyIndexes.length &&
                 this.emptyIndexes.length)) {
                this.shoot1 = this.shoot2 = this.shoot3 = this.getEmptyFillIndex();
            // Если фронт рядом, и врагов много, помогай тем, кто рядом с фронтом.
            } else if (this.enemyIndexes.length > 2) {
                this.shoot1 = this.shoot2 = this.getRandomItemFromArray(this.frontIndexesNearEnemy);
                this.shoot3 = this.getRandomItemFromArray(this.frontIndexesNearEnemy);
            } else if (this.enemyIndexes.length &&
                this.enemyIndexes.length < 3) {
                this.shoot1 = this.shoot2 = this.getRandomItemFromArray(this.enemyIndexes);
                this.shoot3 = this.getRandomItemFromArray(this.enemyIndexes);
            } else {
                this.shoot1 = this.getRandomItemFromArray(this.fillArray);
                this.shoot2 = this.getRandomItemFromArray(this.fillArray);
                this.shoot3 = this.getRandomItemFromArray(this.fillArray);
            }

            this.culcNewOwnComvar();
            return [this.shoot1, this.shoot2, this.shoot3, this.ownComvar];
        }
    };
    return warrior.shoot(comvarSet);
}, "holder");