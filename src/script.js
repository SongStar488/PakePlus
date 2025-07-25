// 番茄钟核心功能实现
// 获取DOM元素
const timerLabel = document.getElementById('timer-label');
const timeLeft = document.getElementById('time-left');
const startStopBtn = document.getElementById('start_stop');
const resetBtn = document.getElementById('reset');
const sessionDecrementBtn = document.getElementById('session-decrement');
const sessionIncrementBtn = document.getElementById('session-increment');
const workDecrementBtn = document.getElementById('work-decrement');
const workIncrementBtn = document.getElementById('work-increment');
const breakDecrementBtn = document.getElementById('break-decrement');
const breakIncrementBtn = document.getElementById('break-increment');
const workLengthDisplay = document.getElementById('work-length');
const breakLengthDisplay = document.getElementById('break-length');
const taskInput = document.getElementById('task-input');
const addTaskBtn = document.getElementById('add-task');
const taskList = document.getElementById('task-list');
const pomodoroCount = document.getElementById('pomodoro-count');
const themeToggle = document.getElementById('theme-toggle');

// 通知和音频处理
function showNotification(title, body) {
    // 检查浏览器是否支持通知
    if (Notification.permission === 'granted') {
        new Notification(title, { body });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification(title, { body });
            }
        });
    }

    // 浏览器政策限制：自动播放音频需要用户交互，暂时移除音频播放功能
    // 如需添加声音提醒，可以在用户点击按钮时初始化音频上下文
}

// 应用状态变量
let timer; // 计时器ID
let isRunning = false; // 计时器是否运行
let isWorkSession = true; // 当前是否为工作会话
let timeLeftInSeconds = 25 * 60; // 默认25分钟
let workMinutes = 25; // 工作时长
let breakMinutes = 5; // 休息时长
let completedPomodoros = 0; // 已完成番茄数
const tasks = []; // 任务列表

// 初始化应用
function init() {
    // 设置初始时间显示
    updateTimerDisplay();
    // 检查本地存储的主题偏好
    if (localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.body.classList.add('dark');
    }
    // 添加事件监听器
    addEventListeners();
}

// 添加所有事件监听器
function addEventListeners() {
    // 计时器控制按钮
    startStopBtn.addEventListener('click', toggleTimer);
    resetBtn.addEventListener('click', resetTimer);
    
    // 会话切换按钮
    sessionDecrementBtn.addEventListener('click', () => changeSession(-1));
    sessionIncrementBtn.addEventListener('click', () => changeSession(1));
    
    // 工作时长调整
    workDecrementBtn.addEventListener('click', () => adjustWorkLength(-1));
    workIncrementBtn.addEventListener('click', () => adjustWorkLength(1));
    
    // 休息时长调整
    breakDecrementBtn.addEventListener('click', () => adjustBreakLength(-1));
    breakIncrementBtn.addEventListener('click', () => adjustBreakLength(1));
    
    // 任务管理
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });
    
    // 主题切换
    themeToggle.addEventListener('click', toggleTheme);
}

// 切换计时器运行状态
function toggleTimer() {
    if (isRunning) {
        clearInterval(timer);
        startStopBtn.innerHTML = '<i class="fa fa-play"></i>';
    } else {
        timer = setInterval(updateTimer, 1000);
        startStopBtn.innerHTML = '<i class="fa fa-pause"></i>';
    }
    isRunning = !isRunning;
    startStopBtn.classList.toggle('btn-click');
}

// 重置计时器
function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    isWorkSession = true;
    timeLeftInSeconds = workMinutes * 60;
    timerLabel.textContent = '工作时间';
    startStopBtn.innerHTML = '<i class="fa fa-play"></i>';
    updateTimerDisplay();
    // 移除警告样式
    timeLeft.classList.remove('timer-warning');
}

// 切换工作/休息会话
function changeSession(direction) {
    // 停止当前计时器
    if (isRunning) toggleTimer();
    
    // 切换会话类型
    isWorkSession = !isWorkSession;
    
    // 更新标签和时间
    timerLabel.textContent = isWorkSession ? '工作时间' : '休息时间';
    timeLeftInSeconds = isWorkSession ? workMinutes * 60 : breakMinutes * 60;
    updateTimerDisplay();
}

// 调整工作时长
function adjustWorkLength(change) {
    // 只有在计时器未运行时才能调整
    if (!isRunning) {
        workMinutes = Math.max(1, Math.min(60, workMinutes + change));
        workLengthDisplay.textContent = workMinutes;
        if (isWorkSession) {
            timeLeftInSeconds = workMinutes * 60;
            updateTimerDisplay();
        }
    }
}

// 调整休息时长
function adjustBreakLength(change) {
    // 只有在计时器未运行时才能调整
    if (!isRunning) {
        breakMinutes = Math.max(1, Math.min(30, breakMinutes + change));
        breakLengthDisplay.textContent = breakMinutes;
        if (!isWorkSession) {
            timeLeftInSeconds = breakMinutes * 60;
            updateTimerDisplay();
        }
    }
}

// 更新计时器显示
function updateTimerDisplay() {
    const minutes = Math.floor(timeLeftInSeconds / 60);
    const seconds = timeLeftInSeconds % 60;
    timeLeft.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // 添加时间警告（最后10秒）
    if (timeLeftInSeconds <= 10) {
        timeLeft.classList.add('timer-warning');
    } else {
        timeLeft.classList.remove('timer-warning');
    }
}

// 更新计时器（每秒调用一次）
function updateTimer() {
    if (timeLeftInSeconds > 0) {
        timeLeftInSeconds--;
        updateTimerDisplay();
    } else {
        // 时间到，切换会话
        showNotification(isWorkSession ? '工作时间结束' : '休息时间结束', 
                         isWorkSession ? '开始休息一下吧！' : '准备开始工作吧！');
        if (isWorkSession) {
            // 工作会话结束，增加已完成番茄数
            completedPomodoros++;
            updateCompletedPomodoros();
        }
        changeSession();
    }
}

// 添加新任务
function addTask() {
    const taskText = taskInput.value.trim();
    if (taskText) {
        const task = {
            id: Date.now(),
            text: taskText,
            completed: false
        };
        tasks.push(task);
        renderTasks();
        taskInput.value = '';
        // 移除"暂无任务"提示
        const emptyTaskMsg = taskList.querySelector('li.italic');
        if (emptyTaskMsg) emptyTaskMsg.remove();
    }
}

// 渲染任务列表
function renderTasks() {
    // 清空现有任务项（除了提示信息）
    const taskItems = taskList.querySelectorAll('li:not(.italic)');
    taskItems.forEach(item => item.remove());
    
    // 渲染所有任务
    tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'task-completed' : ''} ${document.body.classList.contains('dark') ? 'dark' : ''}`;
        li.innerHTML = `
            <span class="task-text" onclick="toggleTaskCompletion(${task.id})"><input type="checkbox" ${task.completed ? 'checked' : ''} class="mr-2 accent-primary">${task.text}</span>
            <div class="task-actions">
                <button class="task-delete" onclick="deleteTask(${task.id})"><i class="fa fa-trash"></i></button>
            </div>
        `;
        taskList.appendChild(li);
    });
}

// 切换任务完成状态
function toggleTaskCompletion(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        renderTasks();
    }
}

// 删除任务
function deleteTask(taskId) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
        tasks.splice(taskIndex, 1);
        renderTasks();
        // 如果任务列表为空，显示提示信息
        if (tasks.length === 0) {
            taskList.innerHTML = '<li class="text-gray-500 dark:text-gray-400 italic text-center">暂无任务，添加你的第一个任务吧！</li>';
        }
    }
}

// 更新已完成番茄数显示
function updateCompletedPomodoros() {
    pomodoroCount.innerHTML = '';
    for (let i = 0; i < completedPomodoros; i++) {
        const tomato = document.createElement('i');
        tomato.className = 'fa fa-tomato text-red-500 text-xl';
        pomodoroCount.appendChild(tomato);
    }
}

// 切换主题（浅色/深色）
function toggleTheme() {
    console.log('主题切换按钮被点击');
    document.body.classList.toggle('dark');
    // 保存主题偏好到本地存储
    if (document.body.classList.contains('dark')) {
        localStorage.setItem('theme', 'dark');
    } else {
        localStorage.setItem('theme', 'light');
    }
    // 更新任务项的主题类
    const taskItems = document.querySelectorAll('.task-item');
    taskItems.forEach(item => item.classList.toggle('dark'));
}

// 暴露几个函数到全局，供内联event handler使用
window.toggleTaskCompletion = toggleTaskCompletion;
window.deleteTask = deleteTask;

// 初始化应用
document.addEventListener('DOMContentLoaded', init);