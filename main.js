let lifts=[];//电梯序列
let callDict=[];//呼叫序列
let floor_num=20;
let callKey=0;
let lift_choice=-1;
let State = {
    "WAIT":0,
    "UP":1,
    "DOWN":-1,
    "ARRIVE":2,
    "FETCH":-2,
}//此处包含了direction
let Direction={
    "UP":1,
    "DOWN":-1,
    "GAP":0,
}

class Lift {
    constructor(lift_id){
        this.id=lift_id;
        this.currentFloor=1;
        this.targetCallKey=-1;
        this.receivedCallFloors=[];//目的楼层序列
        this.state=State['WAIT'];
    }

    setNoneColor() {
        $("tbody").children().eq(floor_num - this.currentFloor).children().eq(this.id).removeAttr("class");
    };

    setMovingColor() {
        console.log("???");
        $("tbody").children().eq(floor_num - this.currentFloor).children().eq(this.id).attr("class", "table-primary");
    };

    setFetchColor() {
        $("tbody").children().eq(floor_num - this.currentFloor).children().eq(this.id).attr("class", "table-warning");
    }

    setArriveColor() {
        $("tbody").children().eq(floor_num - this.currentFloor).children().eq(this.id).attr("class", "table-danger");
    }

    setWaitingColor() {
        $("tbody").children().eq(floor_num - this.currentFloor).children().eq(this.id).attr("class", "table-info");
    }

    setFreeUpIcon(){
        $("tbody").children().eq(floor_num-this.currentFloor).children().eq(5).children().eq(0).attr("disabled", false);
        $("tbody").children().eq(floor_num-this.currentFloor).children().eq(5).children().eq(0).removeAttr("class");
    }

    setFreeDownIcon(){
        $("tbody").children().eq(floor_num-this.currentFloor).children().eq(5).children().eq(1).attr("disabled", false);
        $("tbody").children().eq(floor_num-this.currentFloor).children().eq(5).children().eq(1).removeAttr("class");
    }

    computeDistance(call){  
        let callFloor = call.floor;
        let distance=Math.abs(callFloor-this.currentFloor);
        if(this.state===State['WAIT']){
            return Math.abs(callFloor-this.currentFloor)*0.5;   //等待状态电梯自动乘0.5，防止一辆电梯太过繁忙
        }
        else if (this.targetCallKey === -1) {//没有呼叫，但有送客楼层
           let lastFloor=this.lastFloor();
           if (this.state === 1 && callFloor < lastFloor && callFloor > this.currentFloor) {
                return distance;
            }
            else if (this.state === -1 && callFloor >lastFloor && callFloor < this.currentFloor) {
                return distance;
            } 
            else {
            return -1;  //不可被调度
            }
        } 
        else{
            let currentCallFloor;
            if(!(this.receivedCallFloors.length)){//只有呼叫楼层
                currentCallFloor = callDict[this.targetCallKey].floor;
            }
            else{//呼叫楼层+送客楼层
                let lastFloor=this.lastFloor();
                let lastCallFloor=callDict[this.targetCallKey].floor;
                if(this.state===1){
                    if(lastFloor>=lastCallFloor){
                        currentCallFloor=lastFloor;
                    }
                    else{
                        currentCallFloor=lastCallFloor;
                    }
                }
                else if(this.state===-1){
                    if(lastFloor<=lastCallFloor){
                        currentCallFloor=lastFloor;
                    }
                    else{
                        currentCallFloor=lastCallFloor;
                    }
                }
            }
            if ((callFloor - currentCallFloor) * (currentCallFloor - this.currentFloor) < 0) {
                return distance;
            } 
            else {
                return -1;   //不可被调度
            }
        }
    };

    lastFloor(){
        if(this.state===1){
            let i=this.receivedCallFloors.length-1;
            return this.receivedCallFloors[i];
        }
        if(this.state===-1){
            return this.receivedCallFloors[0];
        }
    };

    async move() {
        let step = this.nextStep();
        switch (step) {
            case State['FETCH']:
                console.log("fetch!");
                this.setFetchColor();
                break;
            case State['ARRIVE']:
                console.log("arrive!");
                this.setArriveColor();
                break;
            case State['WAIT']:
                console.log("wait!");
                this.setWaitingColor();
                break;
            default:
                console.log("run!");
                this.setNoneColor();
                this.currentFloor += step;
                this.setMovingColor();
        }
        await
            sleep(500);
    };

    nextStep=()=>{
        if (this.targetCallKey === -1 && !(this.receivedCallFloors.length)) {
            console.log("wait???");
            this.state = State['WAIT'];
            return State['WAIT'];
        }
        if (this.targetCallKey > -1) {
            if (this.currentFloor === callDict[this.targetCallKey].floor) {
                if(callDict[this.targetCallKey].direction===Direction['UP'])
                {
                    this.setFreeUpIcon();
                }
                else if(callDict[this.targetCallKey].direction===Direction['DOWN'])
                {
                    this.setFreeDownIcon();
                }
                console.log("what's up?");
                delete callDict[this.targetCallKey];
                this.targetCallKey = -1;
                return State['FETCH'];
            } 
            else {
                if(this.receivedCallFloors.length){
                    if (this.receivedCallFloors.indexOf(this.currentFloor) > -1) {
                        this.receivedCallFloors.splice(this.receivedCallFloors.indexOf(this.currentFloor), 1);
                        if (this.id === lift_choice) {
                            reloadChoiceButton();
                        }
                        console.log("emm");
                        return State['ARRIVE'];
                    }
                }
                this.state = (callDict[this.targetCallKey].floor > this.currentFloor) ? 1 : -1;
                return this.state;
            }
        } 
        else {
            if (this.receivedCallFloors.length) {
                if (this.receivedCallFloors.indexOf(this.currentFloor) > -1) {
                    this.receivedCallFloors.splice(this.receivedCallFloors.indexOf(this.currentFloor), 1);
                    if (this.id === lift_choice) {
                        reloadChoiceButton();
                    }
                    console.log("emm");
                    return State['ARRIVE'];
                }
                if (this.state !== -1 && this.receivedCallFloors[this.receivedCallFloors.length - 1] < this.currentFloor) {
                    this.state = -1;
                } 
                else if (this.state !== 1 && this.receivedCallFloors[0] > this.currentFloor) {
                    this.state = 1;
                }
            } 
            else {
                this.state = 0;
            }
            return this.state;
        }
    }
}

initLifts=()=>{
    lifts=[new Lift(0),new Lift(1),new Lift(2),new Lift(3),new Lift(4)];
    changeLiftChoice(0);
    setInterval(monitor,500);
}

monitor=()=>{
    dispatch();
    move();
}

dispatch=()=>{
    for (let keyIndex in Object.keys(callDict)) {
        let key = Object.keys(callDict)[keyIndex];
        if (!(callDict[key].isAssigned)) {
            assign(key);
        }
    }
}

assign=(key)=>{
    let bestIndex = -1;
    mindistance=1000;
    for (let liftIndex = 0; liftIndex < lifts.length; liftIndex++) {
        let lift = lifts[liftIndex];
        let call=callDict[key];
        let distance = lift.computeDistance(call);
        console.log(distance)
        if (distance>-1) {
            if (bestIndex > -1) {
                if (distance<mindistance) {
                    bestIndex = liftIndex;
                    mindistance=distance;
                    console.log("close");
                }
                console.log("far");
            } else {
                bestIndex = liftIndex;
                mindistance=distance;
            }
        }
    }
    if (bestIndex > -1) {
        let bestLift = lifts[bestIndex];
        if (bestLift.targetCallKey > -1) {
            callDict[bestLift.targetCallKey].isAssigned = false;  //一部电梯任何时候只有一个targetCallKey
        }
        bestLift.targetCallKey = key;  //把该请求加入到选中电梯的targetcallkey中
        callDict[key].isAssigned = true;
    }
}

move=()=>{
    for(let i=0;i<lifts.length;i++){
        lifts[i].move();
    }
}

changeLiftChoice=(lift_choice_id)=>{
    lift_choice=lift_choice_id;
    reloadChoiceButton();
}

reloadChoiceButton=()=>{
    for (let i = 0; i < 5; i++) {
        $("#choice-buttons").children().eq(i).children().eq(0).attr("disabled", false);
    }
    $("#choice-buttons").children().eq(lift_choice).children().eq(0).attr("disabled", true);
    for (let i = 0; i < 20; i++) {
        $("#floor-buttons" + parseInt(i / 5)).children().eq(i % 5).children().eq(0).attr("disabled", false);
    }
    console.log("now we are taking elevator no.")
    console.log(lifts[lift_choice].receivedCallFloors);
    for (let i in lifts[lift_choice].receivedCallFloors) {
        let j = floor_num - lifts[lift_choice].receivedCallFloors[i];
        console.log("disabled:")
        console.log(j);
        $("#floor-buttons" + parseInt(j / 5)).children().eq(j % 5).children().eq(0).attr("disabled", true);
    }
}

pushReceivedCallFloors=(floor)=>{
    lifts[lift_choice].receivedCallFloors.push(floor);
        lifts[lift_choice].receivedCallFloors.sort();
        reloadChoiceButton();
        console.log("call floor no.")
        console.log(lifts[lift_choice].receivedCallFloors);
}

addReceivedFloors=(floor)=>{
    console.log("Where are we going?");
    if(lifts[lift_choice].state===State['WAIT'])
    {
        pushReceivedCallFloors(floor);
    }
    else if(lifts[lift_choice].state===State['UP']){
        if(lifts[lift_choice].currentFloor<floor){
            pushReceivedCallFloors(floor);
        }
        else{
            console.log("NO WAY!");
        }
    }
    else if(lifts[lift_choice].state===State['DOWN']){
        if(lifts[lift_choice].currentFloor>floor){
            pushReceivedCallFloors(floor);
        }
        else{
            console.log("NO WAY!");
        }
    }
};

class Call{
    constructor(floor,direction){
        this.floor=floor;
        this.direction=direction;
        this.isAssigned=false;
    }
}

addCall=(floor, direction)=>{
    callDict[callKey] = new Call(floor, direction);
    if(direction===1){
        $("tbody").children().eq(floor_num-floor).children().eq(5).children().eq(0).attr("disabled", true);
        $("tbody").children().eq(floor_num-floor).children().eq(5).children().eq(0).attr("class", "table-warning");
    }
    else{
        $("tbody").children().eq(floor_num-floor).children().eq(5).children().eq(1).attr("disabled", true);
        $("tbody").children().eq(floor_num-floor).children().eq(5).children().eq(1).attr("class", "table-warning");

    }
    console.log("++");
    callKey++;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}