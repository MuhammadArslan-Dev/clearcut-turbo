import TextMarkDown from "@/components/ui/widgets/TextMarkDown";

const samples: { label: string; text: string }[] = [
  { label: "1. Plain text, no line breaks", text: "Single line of plain text with no breaks at all." },
  {
    label: "2. Plain text, multiple line breaks (single \\n, soft break)",
    text: "line one\nline two\nline three",
  },
  {
    label: "3. Multiple paragraphs (double \\n)",
    text: "First paragraph of the explanation.\n\nSecond paragraph of the explanation.\n\nThird paragraph.",
  },
  {
    label: "4. Contains <p>",
    text: "<p>Paragraph A</p><p>Paragraph B</p>",
  },
  {
    label: "5. Contains <br>",
    text: "Line A<br>Line B<br>Line C",
  },
  {
    label: "6. Contains lists",
    text: "Intro line.\n\n1. **Option 1**: reasoning one\n\n2. **Option 2**: reasoning two\n\n3. **Option 3**: reasoning three",
  },
  {
    label: "7. HTML entities",
    text: "5 &lt; 10 and 10 &gt; 5, cost is &amp;100 &amp; rising.",
  },
  {
    label: "8. Mathematical notation (MathJax)",
    text: "The value is $x^2 + y^2 = z^2$ and also $(11011)_2$ in binary.",
  },
  {
    label: "9. Escaped HTML (literal angle brackets as text)",
    text: "Use the \\<div\\> tag to wrap content (literal, not rendered).",
  },
  {
    label: "10. Legitimate formatting (bold + hard break)",
    text: "**Important:** this is bold text.  \nThis line follows a hard break (trailing two spaces).",
  },
  { label: "11a. Empty explanation", text: "" },
  {
    label: "11b. User-supplied real example (multiple 'incorrect option' blocks)",
    text: "The correct option is (3):\n\nWhen previous learned material creates an obstruction in new learning, this phenomenon is known as \"Zero transfer of learning.\" This concept is a bit of a misnomer, as it doesn't mean no learning occurs, but rather that the prior learning has neither a helpful nor a harmful effect on the new learning. Instead, the term most accurately describing an obstruction would be \"Negative transfer of learning.\" Negative transfer occurs when prior learning interferes with or hinders the acquisition of new skills or knowledge. This can happen, for example, when a learner applies rules or strategies from a previous task that are inappropriate or conflicting with the requirements of a new task. The options provided seem to have a slight discrepancy with standard psychological terminology, as \"Zero transfer\" typically means no effect, while \"obstruction\" clearly points to a negative effect. However, given the options, if we must choose the best fit for \"obstruction\" from the provided set, \"Negative transfer\" is the most appropriate. If \"Zero transfer\" is given as the correct answer, it implies a very specific interpretation where the obstruction is not severe enough to be 'negative' but prevents positive influence.\n\nThe incorrect option is (1):\nPositive transfer of learning occurs when prior learning facilitates or enhances the acquisition of new skills or knowledge. This is not the case here, as the previous material creates an \"obstruction\" rather than a help.\n\nThe incorrect option is (3):\nZero transfer of learning typically refers to a situation where prior learning has no observable effect, either positive or negative, on new learning. While the question uses \"obstruction,\" if we are forced to choose from the given options with 3 being correct, it suggests a scenario where the obstruction is not explicitly negative, but simply prevents any positive transfer, leading to a \"zero\" net effect or a state of no beneficial influence.\n\nThe incorrect option is (4):\n\"None of these\" would be the appropriate choice if none of the other options accurately described the situation. However, \"Negative transfer\" is a standard term that perfectly describes an obstruction in learning. Given that option 3 is stated as correct, we adhere to the provided correct option.",
  },
  {
    label: "12. Very long explanation (real production-shaped example)",
    text: "गद्यांश में यह स्पष्ट रूप से उल्लेख किया गया है कि वैज्ञानिक सूर्य की ऊर्जा के प्रति विशेष रूप से उन्मुख हैं। इसका अर्थ है कि वैज्ञानिक सूर्य की ऊर्जा का अध्ययन और अनुसंधान करने में विशेष रुचि रखते हैं। वैज्ञानिकों का कार्य ही प्राकृतिक घटनाओं और स्रोतों का अध्ययन करना होता है, जिसमें सूर्य की ऊर्जा भी शामिल है। इसलिए, विकल्प 2 \"वैज्ञानिकाः\" सही उत्तर है।\n\nअब अन्य विकल्पों की बात करें:\n\n1. **विद्यार्थिनः**: विद्यार्थी शिक्षा प्राप्त करने वाले होते हैं और उनका मुख्य कार्य अध्ययन करना होता है। हालांकि वे सूर्य की ऊर्जा के बारे में पढ़ सकते हैं, लेकिन गद्यांश में यह नहीं कहा गया है कि वे विशेष रूप से सूर्य की ऊर्जा के प्रति उन्मुख हैं।\n\n3. **लिपिकाः**: लिपिक या क्लर्क का कार्य प्रशासनिक होता है, जिसमें दस्तावेजों का प्रबंधन शामिल होता है। उनका कार्य सूर्य की ऊर्जा से संबंधित नहीं होता है।\n\n4. **मन्त्रिणः**: मंत्री सरकार के सदस्य होते हैं और उनका कार्य नीति निर्माण और प्रशासनिक कार्यों से संबंधित होता है। गद्यांश में कहीं भी यह नहीं कहा गया है कि मंत्री सूर्य की ऊर्जा के प्रति विशेष रूप से उन्मुख हैं।\n\nइस प्रकार, वैज्ञानिकों का सूर्य की ऊर्जा के प्रति उन्मुख होना स्पष्ट रूप से गद्यांश में वर्णित है, जिससे विकल्प 2 सही उत्तर बनता है।",
  },
  {
    label: "13. Real production example (BigQuery-style, trailing hard breaks)",
    text:
      "आबंध वियोजन एन्थैल्पी का सही क्रम निम्नलिखित है: $I_{2}<F_{2}<Br_{2}<Cl_{2}$।\n\n1. **Option 1: $I_{2}<F_{2}<Br_{2}<Cl_{2}$**  \n   यह विकल्प सही है क्योंकि आबंध वियोजन एन्थैल्पी का क्रम इस प्रकार होता है।",
  },
];

export default function MdVerifyTempPage() {
  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
        Markdown rendering verification (temp — delete before shipping)
      </h1>
      {samples.map((s, i) => (
        <div
          key={i}
          style={{
            border: "2px solid #ddd",
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: "#666", marginBottom: 8 }}>
            {s.label}
          </div>
          <div style={{ background: "#fafafa", padding: 8, fontSize: 11, marginBottom: 8, whiteSpace: "pre-wrap", color: "#999" }}>
            RAW: {JSON.stringify(s.text)}
          </div>
          <div style={{ background: "#fff" }}>
            <TextMarkDown>{s.text}</TextMarkDown>
          </div>
        </div>
      ))}
    </div>
  );
}
