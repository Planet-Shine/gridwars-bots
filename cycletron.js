global.register(function (comvarSet) {
    var warrior = {
        emptyComvar        : "00000000000000000000000000000000",
        emptyComvarEnd     : "0000000000000",
        ownComvar          : null,
        enemyIndexes       : null,
        emptyIndexes       : null,
        oursIndexes        : null,
        frontIndexes       : null,
        frontEnemyNearOurs : null,
        shoot1             : null,
        shoot2             : null,
        shoot3             : null,
        offsetX            : null,
        offsetY            : null,
        fillArray          : [0,2,8,6,1,5,7,3],
        searchArray        : [0,1,2,5,8,7,6,3],
        isStartCell        : false,
        isOffsetDefined    : false,
        vectorCellIndex    : null,
        neighborOffsets    : {
            0 : [-1,-1],
            1 : [0,-1],
            2 : [1,-1],
            3 : [-1,0],
            5 : [1,0],
            6 : [-1,1],
            7 : [0,1],
            8 : [1,1]
        },
        getEmptyByFillArray : function () {
            var fillArray    = this.fillArray,
                emptyIndexes = this.emptyIndexes,
                length       = fillArray.length,
                index;

            for (index = 0; index < length; index += 1) {
                if (emptyIndexes.indexOf(fillArray[index]) !== -1) {
                    return fillArray[index];
                }
            }
            return -1;
        },
        getBinaryNumber : function (num) {
            var singBit;
            if (num < 0) {
                singBit = '1';
            } else {
                singBit = '0';
            }
            num = Math.abs(num);
            return singBit + Number(num + 128).toString(2).slice(1, 8);
        },
        getOffsetOfNeighborIndex : function (index) {
            return [].concat(this.neighborOffsets[String(index)]);
        },
        extractComvar : function (comvar) {
            // Стркутура хранимого comvar - communication variable
            // 1 бит - признак того, что ячейка не свежая - недавно занятая
            // 2 бит - признак того, что на прошлом ходу враг был среди соседий
            // 3-10 - 8 битов смещения относительно начальной ячейки по x. 3 бит - знак, если 1, то минус.
            // 11-18 - 8 битов смещения относительно начальной ячейки по y. 11 бит - знак, если 1, то минус.
            // 19 бит хранит признак определенности смещения.
            var isNotNew    = !!parseInt(comvar.slice(0,1), 10),
                isEnemyNear = !!parseInt(comvar.slice(1,2), 10),
                offsetX     = (comvar.slice(2,3) === '1' ? -1 : 1) * parseInt(comvar.slice(3,10), 10),
                offsetY     = (comvar.slice(10,11) === '1' ? -1 : 1) * parseInt(comvar.slice(11,18), 10);

            return {
                'isNotNew'    : isNotNew,
                'isEnemyNear' : isEnemyNear,
                'offsetX'     : offsetX,
                'offsetY'     : offsetY
            };
        },
        getIsEmptyComvar : function (testComvar) {
            return this.emptyComvar === testComvar;
        },
        getBit : function (tempBool) {
            return tempBool ? '1' : '0';
        },
        getOffsetDefinedOurIndex : function () {
            var index,
                length = this.oursIndexes.length;

            for (index = 0; index < length; index += 1) {
                if (comvarSet[this.oursIndexes[index]].slice(18, 19) === '1') {
                    return this.oursIndexes[index];
                }
            }

            return -1;
        },
        compileNewComvar : function () {
            this.ownComvar = this.getBit(this.isNotNew) +
                this.getBit(this.isEnemyNear) +
                this.getBinaryNumber(this.offsetX || 0) +
                this.getBinaryNumber(this.offsetY || 0) +
                this.getBit(this.isOffsetDefined) +
                this.emptyComvarEnd;
        },
        culcNewOwnComvar : function () {
            var offset,
                someOldOurIndex,
                someOurComvar;

            // Каждая ячейка хранит позицию начальной клетки относительно текущей,
            // чтобы смочь высчитать вектор движения.
            // Чтобы вычислить смещение, относительно начальной клетки, нужно среди соседей найти хоть одну
            // клетку с полным comvar.
            if (this.getIsEmptyComvar(comvarSet[4])) {
                if (this.oursIndexes.length) {
                    someOldOurIndex = this.getOffsetDefinedOurIndex();
                    if (someOldOurIndex !== -1) {
                        someOurComvar        = comvarSet[someOldOurIndex];
                        offset               = this.getOffsetOfNeighborIndex(someOldOurIndex);
                        someOurComvar        = this.extractComvar(someOurComvar);
                        this.offsetX         = someOurComvar['offsetX'] - offset[0];
                        this.offsetY         = someOurComvar['offsetY'] - offset[1];
                        this.isOffsetDefined = true;
                    }
                } else if (this.emptyIndexes.length === 8) { // Если все вокруг пустые, то это начальная точка.
                    this.offsetX         = 0;
                    this.offsetY         = 0;
                    this.isStartCell     = true;
                    this.isOffsetDefined = true;
                }
            } else {
                someOurComvar = this.extractComvar(comvarSet[4]);
                if (someOurComvar['offsetX'] === 0 && someOurComvar['offsetY'] === 0) {
                    this.isStartCell = true;
                }
                this.offsetX         = someOurComvar['offsetX'];
                this.offsetY         = someOurComvar['offsetY'];
                this.isOffsetDefined = true;
            }

            this.isEnemyNear = !!this.enemyIndexes.length;
            this.isNotNew    = true;
            this.compileNewComvar();
        },
        initialize : function () {
            var enemyIndexes = [],
                emptyIndexes = [],
                oursIndexes  = [],
                frontIndexes = [],
                length       = comvarSet.length,
                index;

            for (index = 0; index < length; index += 1) {
                if (index !== 4) {
                    if (typeof comvarSet[index] === 'number' &&
                        comvarSet[index] !== 0) {
                        enemyIndexes.push(index);
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

            this.enemyIndexes       = enemyIndexes;
            this.emptyIndexes       = emptyIndexes;
            this.oursIndexes        = oursIndexes;
            this.frontIndexes       = frontIndexes;
        },
        getRandomItemFromArray : function (array) {
            var index = parseInt(Math.random() * array.length, 10);
            return array[index];
        },
        getVectorCellFromOffset : function () {
            var offsetX = this.offsetX,
                offsetY = this.offsetY,
                sectorNumber,
                angleInSector;

            if (offsetX === 0 && offsetY > 0) {
                return 7;
            } else if (offsetX === 0 && offsetY < 0) {
                return 1;
            } else if (offsetY === 0 && offsetX > 0) {
                return 5;
            } else if (offsetY === 0 && offsetX < 0) {
                return 3;
            }

            if (offsetX > 0 && offsetY > 0) {
                sectorNumber = 1;
            } else if (offsetX < 0  && offsetY > 0) {
                sectorNumber = 2;
            } else if (offsetX < 0 && offsetY < 0) {
                sectorNumber = 3;
            } else if (offsetX > 0  && offsetY < 0) {
                sectorNumber = 4;
            }

            offsetX = Math.abs(offsetX);
            offsetY = Math.abs(offsetY);
            angleInSector = (Math.atan(offsetY/offsetX) / Math.PI) * 180;
            if ([2, 4].indexOf(sectorNumber) !== -1) {
                angleInSector = 90 - angleInSector;
            }
            angleInSector = (sectorNumber - 1) * 90 + angleInSector;
            if (angleInSector <= 22.5 || angleInSector > 337.5) {
                return 5;
            } else if (angleInSector  <= 67.5) {
                return 8;
            } else if (angleInSector  <= 112.5) {
                return 7;
            } else if (angleInSector  <= 157.5) {
                return 6;
            } else if (angleInSector  <= 202.5) {
                return 3;
            } else if (angleInSector  <= 247.5) {
                return 0;
            } else if (angleInSector  <= 292.5) {
                return 1;
            } else if (angleInSector  <= 337.5) {
                return 2;
            }
        },
        getVectorCellFromNeighbors : function () {
            var isSegmentInProcess  = false,
                segmentIndex        = -1,
                segments            = [],
                maximumSegmentIndex = null,
                length              = this.searchArray.length,
                index,
                targetIndex;

            for (index = 0; index < length; index += 1) {
                targetIndex = this.searchArray[index];
                if (comvarSet[targetIndex] !== 'string') {
                    if (!isSegmentInProcess) {
                        segmentIndex += 1;
                        segments[segmentIndex] = [];
                        isSegmentInProcess = true;
                    }
                    segments[segmentIndex].push(targetIndex);
                } else {
                    isSegmentInProcess = false;
                }
            }
            if (segments.length > 1) {
                // Склеиваем последний с первым, если нужно.
                if (segments[0][0] === 0 && segments[segments.length - 1][segments[segments.length - 1].length - 1] === 3) {
                    segments[0] = segments[segments.length - 1].concat(segments[0]);
                    segments.splice(segments.length - 1, 1);
                }
            }

            length = segments.length;
            if (length) {
                for (index = 0; index < length; index += 1) {
                    if (maximumSegmentIndex === null || segments[index].length > segments[maximumSegmentIndex].length) {
                        maximumSegmentIndex = index;
                    }
                }
                targetIndex = segments[maximumSegmentIndex][parseInt(segments[maximumSegmentIndex].length / 2, 10)];

                return targetIndex;
            } else {
                return 0;
            }
        },
        culcVectorCellIndex : function () {
            if (this.isOffsetDefined) {
                this.vectorCellIndex = this.getVectorCellFromOffset();
            } else if (this.oursIndexes.length) {
                this.vectorCellIndex = this.getVectorCellFromNeighbors();
            }
        },
        getShootByVectorVectorCell : function () {
            var vectorCellIndex = this.vectorCellIndex,
                searchArray     = this.searchArray,
                left            = searchArray.indexOf(vectorCellIndex) - 1,
                self = this,
                left2,
                left3,
                right           = searchArray.indexOf(vectorCellIndex) + 1,
                right2,
                right3,
                back,
                fillLib = {
                    tryToFillBorders : function () {
                        var overlay = [],
                            result  = [],
                            index,
                            length,
                            temp;

                        // Если впереди есть, помогаем, чтобы не профукать.
                        if (self.oursIndexes.length > 6 && (self.enemyIndexes.length || self.emptyIndexes.length)) {
                            if (self.enemyIndexes.length) {
                                temp = self.getRandomItemFromArray(self.enemyIndexes);
                            } else if (self.emptyIndexes.length) {
                                temp = self.getRandomItemFromArray(self.emptyIndexes);
                            }
                            overlay = [temp];
                            if (Math.random() > 0.5) {
                                overlay.push(temp);
                            }
                        }

                        if (self.enemyIndexes.length < 2) {
                            if (typeof comvarSet[vectorCellIndex] === 'string') {
                                result = [vectorCellIndex, vectorCellIndex, vectorCellIndex];
                            // Если с баков нет, то заполняем бока, если впереди свободно.
                            } else if (typeof comvarSet[searchArray[left]] !== 'string') {
                                result = [searchArray[left], searchArray[left], searchArray[left]];
                            } else if (typeof comvarSet[searchArray[right]] !== 'string') {
                                result = [searchArray[right], searchArray[right], searchArray[right]];
                            // Если сзади есть 3 клетки пустые, то кидаемся назад. Что по сути является частным случаем, когда вообще ничего нет.
                            } else if (typeof comvarSet[searchArray[right3]] !== 'string' &&
                                typeof comvarSet[searchArray[left3]] !== 'string' &&
                                typeof comvarSet[searchArray[back]] !== 'string') {
                                result = [searchArray[back], searchArray[back], searchArray[back]];
                            } else { // Если все нормально - кидаемся вперед.
                                result = [vectorCellIndex, vectorCellIndex, vectorCellIndex];
                            }
                        } else { // врагов больше - защитный режим.
                            if (typeof comvarSet[searchArray[back]] !== 'string') {
                                result = [searchArray[back], searchArray[back], searchArray[back]];
                            } else if (typeof comvarSet[searchArray[left3]] !== 'string') {
                                result = [searchArray[left3], searchArray[left3], searchArray[left3]];
                            } else if (typeof comvarSet[searchArray[right3]] !== 'string') {
                                result = [searchArray[right3], searchArray[right3], searchArray[right3]];
                            } else if (typeof comvarSet[searchArray[left2]] !== 'string') {
                                result = [searchArray[left2], searchArray[left2], searchArray[left2]];
                            } else if (typeof comvarSet[searchArray[right2]] !== 'string') {
                                result = [searchArray[right2], searchArray[right2], searchArray[right2]];
                            } else  if (typeof comvarSet[vectorCellIndex] === 'string') {
                                result = [vectorCellIndex, vectorCellIndex, vectorCellIndex];
                            } else  if (typeof comvarSet[searchArray[left]] !== 'string') {
                                result = [searchArray[left], searchArray[left], searchArray[left]];
                            } else if (typeof comvarSet[searchArray[right]] !== 'string') {
                                result = [searchArray[right], searchArray[right], searchArray[right]];
                            } else {
                                result = [vectorCellIndex, vectorCellIndex, vectorCellIndex];
                            }
                        }
                        length = overlay.length;
                        for (index = 0; index < length; index += 1) {
                            result[index] = overlay[index];
                        }
                        return result
                    }
                };

            // Заолняй бока.
            if (left === -1) {
                left = 7;
            }
            left2 = left - 1;
            if (left2 === -1) {
                left2 = 7;
            }
            left3 = left2 - 1;
            if (left3 === -1) {
                left3 = 7;
            }
            back = left3 - 1;
            if (back === -1) {
                back = 7;
            }


            if (right === 8) {
                right = 0;
            }
            right2 = right + 1;
            if (right2 === 8) {
                right2 = 0;
            }
            right3 = right2 + 1;
            if (right3 === 8) {
                right3 = 0;
            }

            return fillLib.tryToFillBorders();
        },
        shoot : function (comvarSet) {
            var targetIndex;
            this.initialize();
            this.culcNewOwnComvar();
            this.culcVectorCellIndex();

            if (this.isStartCell) {
                if (this.emptyIndexes.length) {
                    targetIndex = this.getEmptyByFillArray();
                    this.shoot1 = this.shoot2 = this.shoot3 = targetIndex;
                } else if (this.enemyIndexes.length) {
                    targetIndex = this.getRandomItemFromArray(this.enemyIndexes);
                    this.shoot1 = this.shoot2 = this.shoot3 = targetIndex;
                } else {
                    targetIndex = this.getRandomItemFromArray(this.fillArray);
                    this.shoot1 = this.shoot2 = this.shoot3 = targetIndex;
                }
            } else {
                if (this.vectorCellIndex !== null) {
                    targetIndex = this.getShootByVectorVectorCell();
                    this.shoot1 = targetIndex[0];
                    this.shoot2 = targetIndex[1];
                    this.shoot3 = targetIndex[2];
                } else {
                    targetIndex = this.getRandomItemFromArray(this.fillArray);
                    this.shoot1 = this.shoot2 = this.shoot3 = targetIndex;
                }
            }

            return [this.shoot1, this.shoot2, this.shoot3, this.ownComvar];
        }
    };
    return warrior.shoot(comvarSet);
}, "cycletron");