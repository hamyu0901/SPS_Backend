class common {
    constructor() {

    }
    base64encode(plaintext){
        return Buffer.from(plaintext, "utf8").toString('base64');
    }
    base64decode(base64text){
        return Buffer.from(base64text, 'base64').toString('utf8');
    }
    encrypt(theText) {
        let output = new String;
        let temp = new Array();
        let temp2 = new Array();
        let textSize = theText.length;
        let rnd;
        for (let i = 0; i < textSize; i++) {
            rnd = Math.round(Math.random() * 122) + 68;
            temp[i] = theText.charCodeAt(i) + rnd;
            temp2[i] = rnd;
        }
        for (let i = 0; i < textSize; i++) {
            output += String.fromCharCode(temp[i], temp2[i]);
        }
        return output;
    }
    unEncrypt(theText) {
        let output = new String;
        let temp = new Array();
        let temp2 = new Array();
        let textSize = theText.length;
        for (let i = 0; i < textSize; i++) {
            temp[i] = theText.charCodeAt(i);
            temp2[i] = theText.charCodeAt(i + 1);
        }
        for (let i = 0; i < textSize; i = i+2) {
            output += String.fromCharCode(temp[i] - temp2[i]);
        }
        return output;
    }
    isEmpty(body) {
        if (typeof body === 'text') {
            if (body == "") {
                return true;
            }
            else if (body == undefined) {
                return true;
            }
            else {
                return false;
            }
        }
        else {
            if (body == undefined) {
                return true;
            }
            else {
                return false;
            }
        }
    }
    checkJobName(jobname) {
        return jobname.split("'").join('"');
    }
    isHMMR(version) {
        if (version === 308) {
            return true;
        }
        else {
            return false;
        }
    }
}

class templateList {
    constructor() {
        this.dataStore = [];
        this.pos = 0;
        this.listSize = 0;
    }

    append(element) {
        this.dataStore[this.listSize] = element;
        this.listSize++;
    }

    find(element) {
        for (let i = 0; i < this.listSize; i++) {
            if (this.dataStore[i] == element) {
                return i;
            }
        }
        return -1;
    }

    remove(element) {
        let removePos = this.find(element);
        if (removePos > -1) {
            this.dataStore.splice(removePos, 1);
            this.listSize--;
            return true;
        }
        return false;
    }

    lenght() {
        return this.listSize;
    }

    insert(element, after) {
        let insertPos = this.find(after);
        if (insertPos > -1) {
            this.dataStore.splice(insertPos + 1, 0, element);
            this.listSize++;
            return true;
        }
        return false;
    }

    clear() {
        this.dataStore = [];
        this.listSize = 0;
        this.pos = 0;
    }

    front() {
        this.pos = 0;
    }

    end() {
        this.pos = this.listSize-1;
    }

    prev() {
        if(this.pos > 0){
            this.pos--;
        }
    }

    next() {
        if(this.pos < this.listSize-1){
            this.pos++;
        }
    }

    currPos() {
        return this.pos;
    }

    moveTo(position) {
        if(position < this.listSize){
            this.pos = position;
        }
    }

    getElement() {
        return this.dataStore[this.pos];
    }
}

class settingConfig {
    constructor() {

    }
    version = 'v2.5.0.0';
    revision = 'R220907';
    copyright = '2022';
    readData() {

    }

    writeData() {

    }

    getDBPassword() {

    }

    getDBIP() {

    }

    getDBPort() {

    }

    getDBName() {

    }
    getVersion() {
        return this.version;
    }
    getRevision() {
        return this.revision;
    }
    getCopyRight() {
        return this.copyright;
    }
}

export { common, templateList, settingConfig }