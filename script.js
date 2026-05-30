const display = document.getElementById("display");
const previous = document.getElementById("previous");

const historyBtn = document.getElementById("historyBtn");
const historyPanel = document.getElementById("historyPanel");
const historyList = document.getElementById("historyList");

let expression = "";

document.querySelectorAll(".buttons button")
.forEach(btn=>{

    btn.addEventListener("click",()=>{

        const value = btn.innerText;

        if(value==="AC"){
            expression="";
            display.value="";
            previous.innerText="";
            return;
        }

        if(value==="DEL"){
            expression=expression.slice(0,-1);
            display.value=expression;
            return;
        }

        if(value==="="){

            try{

                let exp = expression
                .replace(/×/g,"*")
                .replace(/÷/g,"/");

                const result = eval(exp);

                previous.innerText =
                expression + " =";

                display.value = result;

                const item =
                document.createElement("li");

                item.textContent =
                `${expression} = ${result}`;

                historyList.prepend(item);

                expression =
                result.toString();

            }

            catch{
                display.value="Error";
                expression="";
            }

            return;
        }

        expression += value;

        display.value = expression;
    });

});

historyBtn.addEventListener("click",()=>{

    historyPanel.style.display =
    historyPanel.style.display==="block"
    ? "none"
    : "block";
});

document.addEventListener("keydown",(e)=>{

    const key=e.key;

    if(/[0-9+\-*/.%]/.test(key)){
        expression+=key;
        display.value=expression;
    }

    if(key==="Backspace"){
        expression=expression.slice(0,-1);
        display.value=expression;
    }

    if(key==="Enter"){

        try{

            const result=eval(expression);

            previous.innerText=
            expression+" =";

            display.value=result;

            expression=
            result.toString();

        }

        catch{
            display.value="Error";
            expression="";
        }
    }
});
