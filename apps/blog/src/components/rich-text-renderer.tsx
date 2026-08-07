// // components/RichTextRenderer.tsx
// import React from 'react';

// interface RichTextRendererProps {
//   content: any; // The JSON structure from Payload's rich text field
// }

// // Basic renderer for Slate-based rich text from Payload
// const renderElement = (node: any, index: number) => {
//   switch (node.type) {
//     case 'h1': return <h1 key={index} className="text-4xl font-bold my-4">{node.children.map(renderLeaf)}</h1>;
//     case 'h2': return <h2 key={index} className="text-3xl font-bold my-3">{node.children.map(renderLeaf)}</h2>;
//     case 'h3': return <h3 key={index} className="text-2xl font-bold my-2">{node.children.map(renderLeaf)}</h3>;
//     case 'h4': return <h4 key={index} className="text-xl font-semibold my-2">{node.children.map(renderLeaf)}</h4>;
//     case 'h5': return <h5 key={index} className="text-lg font-semibold my-1">{node.children.map(renderLeaf)}</h5>;
//     case 'h6': return <h6 key={index} className="text-base font-semibold my-1">{node.children.map(renderLeaf)}</h6>;
//     case 'blockquote': return <blockquote key={index} className="border-l-4 border-gray-400 pl-4 italic my-4">{node.children.map(renderLeaf)}</blockquote>;
//     case 'code': return <pre key={index} className="bg-gray-100 p-2 rounded my-4 overflow-x-auto"><code>{node.children.map(renderLeaf)}</code></pre>;
//     case 'ul': return <ul key={index} className="list-disc list-inside ml-4 my-2">{node.children.map(renderElement)}</ul>;
//     case 'ol': return <ol key={index} className="list-decimal list-inside ml-4 my-2">{node.children.map(renderElement)}</ol>;
//     case 'li': return <li key={index}>{node.children.map(renderLeaf)}</li>;
//     case 'link':
//       const href = node.url || node.linkType === 'custom' ? node.customUrl : (node.doc ? node.doc.value.slug : '#'); // Adjust based on your link type config in Payload
//       return (
//         <a key={index} href={href} target={node.newTab ? '_blank' : '_self'} rel={node.newTab ? 'noopener noreferrer' : ''} className="text-blue-600 hover:underline">
//           {node.children.map(renderLeaf)}
//         </a>
//       );
//     default:
//       return <p key={index} className="my-2">{node.children.map(renderLeaf)}</p>;
//   }
// };

// const renderLeaf = (leaf: any, index: number) => {
//   let content: React.ReactNode = leaf.text;

//   if (leaf.bold) content = <strong key={`bold-${index}`}>{content}</strong>;
//   if (leaf.italic) content = <em key={`italic-${index}`}>{content}</em>;
//   if (leaf.underline) content = <u key={`underline-${index}`}>{content}</u>;
//   if (leaf.strikethrough) content = <s key={`strikethrough-${index}`}>{content}</s>;
//   if (leaf.code) content = <code key={`code-${index}`} className="bg-gray-200 px-1 rounded">{content}</code>;

//   return content;
// };

// export const RichTextRenderer: React.FC<RichTextRendererProps> = ({ content }) => {
//   if (!content || !Array.isArray(content)) {
//     return null;
//   }
//   return (
//     <>
//       {content.map((node, index) => {
//         if (node.children) {
//           return renderElement(node, index);
//         }
//         return renderLeaf(node, index);
//       })}
//     </>
//   );
// };