import React, { useState, useEffect, useRef } from "react";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { InputNumber } from "primereact/inputnumber";
import Layout from "@/Layouts/layout/layout.jsx";

const Pomodoro = () => {
    const [step, setStep] = useState(1);
    const [totalHours, setTotalHours] = useState(6);
    const [intervalOption, setIntervalOption] = useState({
        work: 25 * 60,
        rest: 10 * 60,
    });
    const [plan, setPlan] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [running, setRunning] = useState(false);
    const [pausesCount, setPausesCount] = useState({});
    const [breakMessage, setBreakMessage] = useState("");
    const [muted, setMuted] = useState(false);

    const tickAudio = useRef(null);
    const bellAudio = useRef(null);

    const intervalOptionsList = [
        {
            label: "30 sec work / 10 sec break (for testing)",
            work: 30,
            rest: 10,
        },
        { label: "25 min work / 5 min break", work: 25 * 60, rest: 10 * 60 },
        { label: "15 min work / 5 min break", work: 15 * 60, rest: 5 * 60 },
        { label: "30 min work / 10 min break", work: 30 * 60, rest: 10 * 60 },
        { label: "45 min work / 15 min break", work: 45 * 60, rest: 15 * 60 },
    ];
    // Handle countdown
    useEffect(() => {
        if (running && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        } else if (timeLeft === 0 && running) {
            handleBlockEnd();
        }
    }, [running, timeLeft]);

    // Play/pause ticking sound for work blocks
    useEffect(() => {
        if (plan[currentIndex]?.type === "work" && running) {
            // Attempt to play only if not muted
            if (!muted && tickAudio.current) {
                tickAudio.current
                    .play()
                    .catch((e) => console.error("Audio play error:", e));
                tickAudio.current.loop = true;
            } else if (tickAudio.current) {
                tickAudio.current.pause();
                tickAudio.current.currentTime = 0;
            }
        } else {
            if (tickAudio.current) {
                tickAudio.current.pause();
                tickAudio.current.currentTime = 0;
            }
        }
    }, [plan, currentIndex, running, muted]);

    // When block changes (index or plan changes), reset timeLeft
    useEffect(() => {
        if (plan.length > 0 && currentIndex < plan.length) {
            const currentBlock = plan[currentIndex];
            setTimeLeft(currentBlock.duration);
        }
    }, [currentIndex, plan]);

    // Update break message when pausesCount changes or block changes
    useEffect(() => {
        if (plan.length > 0 && currentIndex < plan.length) {
            const currentBlock = plan[currentIndex];
            if (currentBlock.type === "break") {
                const totalPauses = Object.values(pausesCount).reduce(
                    (a, b) => a + b,
                    0
                );
                const msg = getWeightedMessage(totalPauses);
                setBreakMessage(msg);
            } else {
                setBreakMessage("");
            }
        }
    }, [currentIndex, plan, pausesCount]);

    const handleBlockEnd = () => {
        if (!muted && bellAudio.current) {
            bellAudio.current.play().catch((e) => console.error(e));
        }
        setRunning(false);
        setTimeout(() => {
            if (currentIndex < plan.length - 1) {
                setCurrentIndex((prev) => prev + 1);
            } else {
                alert("All done! You completed your focus plan.");
            }
        }, 1000);
    };

    const generatePlan = () => {
        const totalSeconds = totalHours * 3600;
        const workDur = intervalOption.work;
        const restDur = intervalOption.rest;
        const cycles = Math.floor(totalSeconds / workDur);
        let fullPlan = [];
        for (let i = 0; i < cycles; i++) {
            fullPlan.push({ type: "work", duration: workDur });
            if (i < cycles - 1) {
                fullPlan.push({ type: "break", duration: restDur });
            }
        }

        setPlan(fullPlan);
        setCurrentIndex(0);
        setPausesCount({});
        setStep(3);
    };

    const startPlan = () => {
        setRunning(true);
    };

    const pausePlan = () => {
        // Only increment pause count if currently running and on a work block
        if (running && plan[currentIndex]?.type === "work") {
            setRunning(false);
            setPausesCount((prev) => {
                const currentCount = prev[currentIndex] || 0;
                const newCount = currentCount + 1;
                return { ...prev, [currentIndex]: newCount };
            });
        } else {
            setRunning(false);
        }
    };

    const progressFraction =
        plan.length > 0 &&
        currentIndex < plan.length &&
        plan[currentIndex].duration > 0
            ? (plan[currentIndex].duration - timeLeft) /
              plan[currentIndex].duration
            : 0;

    function formatTime(totalSec) {
        const minutes = Math.floor(totalSec / 60);
        const seconds = totalSec % 60;
        return `${minutes.toString().padStart(2, "0")}:${seconds
            .toString()
            .padStart(2, "0")}`;
    }

    function getBlockColor(block, index) {
        if (block.type === "work") {
            const pauseCount = pausesCount[index] || 0;
            if (pauseCount === 0) {
                return "#4ade80"; // Green
            } else if (pauseCount === 1) {
                return "#f97316"; // Orange
            } else {
                return "#dc2626"; // Red
            }
        } else {
            return "#38bdf8"; // Blue for breaks
        }
    }

    function getWeightedMessage(totalPauses) {
        const goofy = [
            "Break time! Stare at the ceiling and imagine you're a cloud.",
            "Rest up! Pretend you're a potato charging its battery.",
            "Time off! Count how many times you can blink in a minute.",
            "Chill! Sing your favorite song in your head backwards.",
            "Relax! Imagine penguins trying to do ballet.",
            "Break! Picture a hamster driving a tiny car.",
        ];

        const mild = [
            `Taking a break? You've paused ${totalPauses} time(s). Still not too bad... I guess.`,
            `A break after ${totalPauses} pause(s)? Not too shabby.`,
            `You paused ${totalPauses} time(s). Take it easy, buddy.`,
        ];

        const moderate = [
            `You paused ${totalPauses} time(s)... Getting more familiar with that 'Pause' button, aren't we?`,
            `${totalPauses} pauses so far. Perhaps working isn't your strong suit today.`,
            `Wow, ${totalPauses} pauses. Let me guess, you're writing a novel on how not to focus?`,
        ];

        const intense = [
            `${totalPauses} pauses? Impressive dedication... to avoiding work.`,
            `${totalPauses} times paused. At this point, the breaks are working harder than you are.`,
            `You're at ${totalPauses} pauses now. Maybe consider a career in professional resting.`,
        ];

        if (totalPauses === 0) {
            return goofy[Math.floor(Math.random() * goofy.length)];
        } else if (totalPauses < 3) {
            return mild[Math.floor(Math.random() * mild.length)];
        } else if (totalPauses < 6) {
            return moderate[Math.floor(Math.random() * moderate.length)];
        } else {
            return intense[Math.floor(Math.random() * intense.length)];
        }
    }

    const currentBlock = plan[currentIndex];

    // Convert seconds to a readable "X min" format
    const formatInterval = (seconds) => {
        const mins = Math.floor(seconds / 60);
        return `${mins} min`;
    };

    return (
        <Layout>
            <div className="p-4 max-w-lg mx-auto font-sans">
                <audio
                    ref={tickAudio}
                    src="sounds/tick.mp3"
                    preload="auto"
                    muted={muted}
                ></audio>
                <audio
                    ref={bellAudio}
                    src="sounds/bell.mp3"
                    preload="auto"
                    muted={muted}
                ></audio>

                {step === 1 && (
                    <Card
                        title="How many hours do you want to focus today?"
                        className="mb-4"
                    >
                        <div className="flex items-center mb-3 gap-2">
                            <InputNumber
                                value={totalHours}
                                onValueChange={(e) => setTotalHours(e.value)}
                                min={0.1}
                                max={24}
                                mode="decimal"
                                step={0.1}
                            />
                            <span>Hours</span>
                        </div>
                        <Button
                            label="Next"
                            onClick={() => setStep(2)}
                            className="p-button-primary"
                        />
                    </Card>
                )}

                {step === 2 && (
                    <Card
                        title="Choose your working/break intervals"
                        className="mb-4"
                    >
                        <select
                            className="border p-2 w-full mb-3"
                            onChange={(e) => {
                                const val = JSON.parse(e.target.value);
                                setIntervalOption(val);
                            }}
                            value={JSON.stringify(intervalOption)}
                        >
                            {intervalOptionsList.map((opt, i) => (
                                <option
                                    key={i}
                                    value={JSON.stringify({
                                        work: opt.work,
                                        rest: opt.rest,
                                    })}
                                >
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <Button
                            label="Generate Plan"
                            onClick={generatePlan}
                            className="p-button-primary"
                        />
                    </Card>
                )}

                {step === 3 && (
                    <Card title="Your Focus Plan" className="mb-4">
                        {/* Display Selected Intervals Box */}
                        <div className="mb-4 p-2 bg-blue-100 border border-blue-300 rounded-md text-center">
                            <p className="text-blue-700 font-semibold">
                                Selected Intervals:
                                {" Work: "}
                                {formatInterval(intervalOption.work)}
                                {" | Break: "}
                                {formatInterval(intervalOption.rest)}
                            </p>
                        </div>
                        {plan.length > 0 && (
                            <div className="flex flex-wrap gap-4 mb-4 justify-center">
                                {plan.map((block, index) => {
                                    const isCurrent = index === currentIndex;
                                    const fillFraction = isCurrent
                                        ? progressFraction
                                        : index < currentIndex
                                        ? 1
                                        : 0;
                                    const backgroundColor = getBlockColor(
                                        block,
                                        index
                                    );

                                    return (
                                        <div
                                            key={index}
                                            style={{
                                                width: "70px",
                                                height: "70px",
                                                backgroundColor: "#e5e7eb",
                                                position: "relative",
                                                borderRadius: "8px",
                                                border: "2px solid #9ca3af",
                                                overflow: "hidden",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontWeight: "bold",
                                                color: "#ffffff",
                                                fontSize: "16px",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    bottom: 0,
                                                    left: 0,
                                                    width: "100%",
                                                    height:
                                                        fillFraction * 100 +
                                                        "%",
                                                    backgroundColor:
                                                        backgroundColor,
                                                    transition:
                                                        "height 0.5s ease",
                                                }}
                                            ></div>
                                            <span
                                                style={{
                                                    position: "relative",
                                                    zIndex: 1,
                                                }}
                                            >
                                                {block.type === "work"
                                                    ? "W"
                                                    : "B"}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {plan.length > 0 && currentIndex < plan.length && (
                            <>
                                <h2 className="text-center text-xl font-semibold mb-2">
                                    {currentBlock.type === "work"
                                        ? "Working Time"
                                        : "Break Time"}
                                </h2>
                                <div className="text-center mb-2 text-2xl font-mono">
                                    {formatTime(timeLeft)}
                                </div>
                                {currentBlock.type === "break" &&
                                    breakMessage && (
                                        <div className="text-center mb-3 text-gray-700 italic">
                                            <p>{breakMessage}</p>
                                        </div>
                                    )}
                                <div className="flex justify-center gap-2">
                                    {!running && (
                                        <Button
                                            label="Start"
                                            icon="pi pi-play"
                                            onClick={startPlan}
                                            className="p-button-success"
                                        />
                                    )}
                                    {running && (
                                        <Button
                                            label="Pause"
                                            icon="pi pi-pause"
                                            onClick={pausePlan}
                                            className="p-button-warning"
                                        />
                                    )}
                                    {/* New Mute/Unmute button */}
                                    <Button
                                        label={muted ? "Unmute" : "Mute"}
                                        icon={
                                            muted
                                                ? "pi pi-volume-off"
                                                : "pi pi-volume-up"
                                        }
                                        onClick={() => setMuted(!muted)}
                                        className="p-button-secondary"
                                    />
                                </div>
                            </>
                        )}

                        {currentIndex >= plan.length && plan.length > 0 && (
                            <h2 className="text-center text-xl font-semibold">
                                All done! Congratulations!
                            </h2>
                        )}
                    </Card>
                )}
            </div>
        </Layout>
    );
};

export default Pomodoro;
