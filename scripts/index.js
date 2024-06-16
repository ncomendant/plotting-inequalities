(() => {
    const INEQUALITY_SYMBOLS = '<≤≥>';
    const VARIABLES = 'bcdefghjkmnpqrstwxyz';
    const RANGE = 10;
    const CIRCLE_Y = 55;
    const ANSWER_CIRCLE_Y = 15;
    const SCORE_PENALTY = 1;

    const init = () => {
        const canvas = document.querySelector('canvas');
        const switchDirectionBtn = document.querySelector('#switchDirectionBtn');
        const changeCircleBtn = document.querySelector('#changeCircleBtn');
        const inequalityEl = document.querySelector('.question .inequality');
        const checkBtn = document.querySelector('#checkBtn');
        const scoreNumEl = document.querySelector('.score .num');

        // Dark mode detection and setting
        const setColorScheme = () => {
            const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.body.classList.toggle('dark-mode', isDarkMode);
            document.body.classList.toggle('light-mode', !isDarkMode);
        };

        // Apply color scheme on load
        setColorScheme();

        // Listen for changes in the color scheme
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', setColorScheme);

        let state = {
            answer: initProblem(inequalityEl), // {num: int, open: bool, rightDirection: bool}
            response: {num: 0, open: true, rightDirection: true}, // {num: int, open: bool, rightDirection: bool}
            mouseDown: false,
            problemEnded: false,
            score: 0,
        };

        canvas.addEventListener('mousemove', event => {
            if (state.mouseDown) {
                const response = onMouseMove(canvas, state.response, state.problemEnded, event);
                state = Object.assign(state, {response});
            }
        });

        canvas.addEventListener('mousedown', () => {
            state.mouseDown = true;
        });

        canvas.addEventListener('mouseup', () => {
            state.mouseDown = false;
        });

        canvas.addEventListener('mouseout', () => {
            state.mouseDown = false;
        });

        switchDirectionBtn.addEventListener('click', () => {
            const response = onSwitchDirectionClick(canvas, state.response, state.problemEnded);
            state = Object.assign(state, {response});
        });

        changeCircleBtn.addEventListener('click', () => {
            const response = onChangeCircleClick(canvas, state.response, state.problemEnded);
            state = Object.assign(state, {response});
        });

        checkBtn.addEventListener('click', () => {
            state = onCheckClick(canvas, switchDirectionBtn, changeCircleBtn, inequalityEl, scoreNumEl, state);
        });

        draw(canvas, state.response, false);
    };

    const onMouseMove = (canvas, response, problemEnded, event) => {
        if (problemEnded) {
            return response;
        }
        const num = xToNum(canvas.width, event.offsetX);
        const r = Object.assign(response, {num});
        draw(canvas, r, false);
        return r;
    };

    const onSwitchDirectionClick = (canvas, response, problemEnded) => {
        if (problemEnded) {
            return response;
        }
        const r = Object.assign(response, {rightDirection: !response.rightDirection});
        draw(canvas, r, false);
        return r;
    };

    const onChangeCircleClick = (canvas, response, problemEnded) => {
        if (problemEnded) {
            return response;
        }
        const r = Object.assign(response, {open: !response.open});
        draw(canvas, r, false);
        return r;
    };

    const onCheckClick = (canvas, switchDirectionBtn, changeCircleBtn, inequalityEl, scoreNumEl, state) => {
        const correct = (
            state.response.num === state.answer.num &&
            state.response.open === state.answer.open &&
            state.response.rightDirection === state.answer.rightDirection
        );

        // if problem not yet ended, increment score if answer correct or decrease by SCORE_PENALTY if not correct
        // score cannot fall below 0
        const score = (!state.problemEnded) ? (correct) ? state.score + 1 : Math.max(0, state.score - SCORE_PENALTY) : state.score;
        scoreNumEl.textContent = score;

        if (state.problemEnded || correct) {
            const state = {
                answer: initProblem(inequalityEl),
                response: {num: 0, open: true, rightDirection: true},
                mouseDown: false,
                problemEnded: false,
                score,
            };
            draw(canvas, state.response, false);
            switchDirectionBtn.disabled = false;
            changeCircleBtn.disabled = false;
            return state;
        } else {
            switchDirectionBtn.disabled = true;
            changeCircleBtn.disabled = true;
            draw(canvas, state.answer, true);
            return Object.assign(state, {problemEnded: true, score});
        }
    };

    const flipInequalitySymbol = (sign) => {
        switch (sign) {
            case '<':
                return '>';
            case '>':
                return '<';
            case '≤':
                return '≥';
            case '≥':
                return '≤';
        }
    };

    const initProblem = inequalityEl => {
        const variable = VARIABLES[Math.floor(Math.random()*VARIABLES.length)];
        const inequalitySymbol = INEQUALITY_SYMBOLS[Math.floor(Math.random()*INEQUALITY_SYMBOLS.length)];
        const open = '<>'.indexOf(inequalitySymbol) >= 0;
        const rightDirection = '≥>'.indexOf(inequalitySymbol) >= 0;
        const num = Math.floor(Math.random()*(RANGE + 1)) - (RANGE/2);
        const question = (Math.random() >= 0.5) ? 
            `${variable} ${inequalitySymbol} ${num}`: 
            `${num} ${flipInequalitySymbol(inequalitySymbol)} ${variable}`;
        inequalityEl.textContent = question;
        return {num, open, rightDirection};
    };

    const draw = (canvas, data, isAnswer) => {
        const x = numToX(canvas.width, data.num);
        const y = (isAnswer) ? ANSWER_CIRCLE_Y : CIRCLE_Y; 

        const ctx = canvas.getContext('2d');
        if (!isAnswer) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        const color = (isAnswer) ? "#ff0000" : "#0000ff";

        ctx.lineWidth = 10;
        ctx.strokeStyle = color;
        ctx.lineStyle = color;

         // make line
         ctx.beginPath();
         ctx.moveTo(x, y);
         if (data.rightDirection) {
             ctx.lineTo(canvas.width, y);
         } else {
             ctx.lineTo(0, y);
         }
         ctx.stroke();

        // make circle
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, 2 * Math.PI);
        ctx.stroke();
        if (data.open) {
            ctx.fillStyle = '#ffffff';
        } else {
            ctx.fillStyle = color;
        }
        ctx.fill();       
    };

    const xToNum = (canvasWidth, x) => {
        let num = Math.round(x / distanceBetweenMarks(canvasWidth)) - RANGE/2 - 1;

        // clamp num to nearest valid integer
        num = Math.min(Math.max(num, -RANGE/2), RANGE/2);

        return num;
    };

    const numToX = (canvasWidth, num) => {
        return ((num + RANGE/2 + 1) * distanceBetweenMarks(canvasWidth));
    };

    const distanceBetweenMarks = (canvasWidth) => {
        // add 2 to take into account ends of number line beyond tick marks
        return (canvasWidth / (RANGE + 2));
    };

    window.onload = init;
})();
