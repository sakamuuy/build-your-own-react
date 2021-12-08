// ---------- create element
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) => (
        typeof child === "object"? child : createTextElement(child)
      ))
    }
  }
}

function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: []
    }
  }
}

// ------------ render
// Reactの Render phase と Commit Phaseについて
// 最初にRenderPhaseが実行される。このフェーズは仮想DOMを作成する。
// 次にCommitPhaseが実行される。RenderPhaseで作った仮想DOMに一致するように実DOMを更新する

// ファイバーメモ
// > Reactのファイバーは更新処理に優先度が付けられるようにするために設定された作業の構成単位のこと
// ファイバーがやること
// 1. 要素をDOMに追加する
// 2. 子要素のためのファイバーを作成する
// 3. 次の作業単位を選択する
let nextUnitOfWork = null // 次のidleCallbackで呼ばれる処理
let currentRoot = null // "DOMにコミットした最後のファイバーツリー"への参照
let wipRoot = null
let deletions = null
let wipFiber = null
let hookIndex = null


function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    // alternateは前のコミットフェーズでDOMにコミットした古いファイバーへのリンク
    alternate: currentRoot
  }
  deletions = []
  nextUnitOfWork = wipRoot
}

/**
 * render内で更新する関数の呼び出しと次のworkLoopで処理するfiberの判定
 * @param {*} fiber 現在のworkLoopで処理するfiber 
 * @returns nextUnitOfWork 次のworkLoopで処理するfiber
 * 
 * performUnitOfWork
 *       ↓
 * is FunctionalComponent? → updateFunctionComponent()
 *       ↓ else                      ↓
 * updateHostComponent() → reconcileChildren()
 */
function performUnitOfWork(fiber) {
  const isFunctionComponent = fiber.type instanceof Function
  if (isFunctionComponent) {
    updateFunctionComponent(fiber)
  } else {
    updateHostComponent(fiber)
  }

  // 子要素があればreturn
  if (fiber.child) {
    return fiber.child
  }

  // 子要素なし、かつ
  let nextFiber = fiber
  while (nextFiber) {
    // 兄弟要素があればreturn
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    // 親に遡る、親がいなくなったら処理終了
    nextFiber = nextFiber.parent
  }
}

function updateFunctionComponent(fiber) {
  wipFiber = fiber
  hookIndex = 0
  wipFiber.hooks = []
  /* Function Componentの場合、createElementの第一引数は関数で、typeという名前でfiberに保持される
   * これを実行することで子要素が取れる
   * 引数にfiber.propsを渡すことで親のpropsと子要素を渡すことができる?
  */
  const children = [fiber.type(fiber.props)]
  reconcileChildren(fiber, children)
}

function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }
  reconcileChildren(fiber, fiber.props.children)
}

/**
 *  子要素のファイバーを作成する
 * @param {*} wipFiber 今処理中のfiber
 * @param {*} elements 今処理中のfiberが持つ子要素
 */
function reconcileChildren(wipFiber, elements) {
  let index = 0
  // 最後にDOMを更新したFiber
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  // 下のwhileループで一つ前に処理したelement
  let prevSibling = null

  while (index < elements.length || oldfiber != null) {
    // DOMにrenderingしたいもの
    const element = elements[index]
    let newFiber = null
    // 最後にDOMを更新したファイバーと同じ仮想DOMか判定
    const sameType = oldFiber && element && element.type == oldFiber.type

    // 古いファイバーと新しい要素が同じタイプの場合、DOMノードを保持し、新しいpropsで更新
    if (sameType) {
      // 更新する
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE"
      }
    }

    // タイプが異なり、新しい要素がある場合は、新しいDOMノードを作成する
    if (element && !sameType) {
      // DOMを追加
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        paret: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT"
      }
    }

    // タイプが異なり、古いファイバーがある場合は、古いノードを削除する
    if (oldFiber && !sameType) {
      // 削除
      oldFiber.effectTag = "DELETION"
      deletions.push(oldFiber)
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling
    }

    if (index === 0) {
      wipFiber.child = newFiber
    } else if (element) {
      prevSibling.sibling = newFiber
    }

    prevSibling = newFiber
    index++
  }
}


// ------ DOM操作

// -------------------


// ----- workLoop

function workLoop(deadline) {
  let shouldYield = false
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWOrk(nextUnitOfWork)
    shouldYield = deadline.timeRemaining() < 1
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot()
  }

  requestIdleCallback(workLoop)
}

// 次にブラウザがidleになったらworkLoopを実行
requestIdleCallback(workLoop)


// -------------------------------



const Didact = {
  createElement,
  render,
  useState
}

/** @jsx Didact.createElement */
function Counter() {
  const [state, setState] = Didact.useState(1)
  return <h1 onClick={() => {
      setState((c) => c + 1)
    }}>Count: {state}</h1>
}
 const element = <Counter />;
 const container = document.getElementById("root")
 Didact.render(element, container)


// const step0 = () => {
//   const element = {
//     type: 'h1',
//     props: {
//       title: 'foo',
//       children: 'Hello'
//     }
//   }

//   const node = document.createElement(element.type)
//   node['title'] = element.props.title

//   const text = document.createTextNode('')
//   text['nodeValue'] = element.props.children

//   const container = document.getElementById('root')
//   node.appendChild(text)
//   container.appendChild(node)
// }

// (() => {

//   function createTextElement(text) {
//     return {
//       type: 'TEXT_ELEMENT',
//       props: {
//         nodeValue: text,
//         children: []
//       }
//     }
//   }

//   function createElement(type, props, ...children) {
//     return {
//       type,
//       props: {
//         ...props,
//         children: 
//           children.map(
//             child => typeof child === 'object'? child : createTextElement(child)
//           )
//       }
//     }
//   }

//   function createDom(fiber) {
//     const dom = element.type === "TEXT_ELEMENT"?
//       document.createTextNode("") :
//       document.createElement(element.type)

//     const isProperty = key => key !== 'children'
//     Object.keys(element.props)
//       .fill(isProperty)
//       .forEach(name => {
//         dom[name] = element.props[name]
//       })

//     return dom
//   }

//   const isEvent = key => key.startsWith("on")
//   const isProperty = key => key !== "children" && !isEvent(key)
//   const isNew = (prev, next) => key => prev[key] !== next[key]
//   const isGone = (prev, next) => key => !(key in next)
//   function updateDom(dom, prevProps, nextProps) {
//     Object.keys(prevProps)
//       .filter(isEvent)
//       .filter(key => !(key in nextProps) || isNew(prevProps, nextProps)(key))
//       .forEach(name => {
//         const eventType = name.toLowerCase().substring(2)
//         dom.removeEventListener(
//           eventType,
//           prevProps[name]
//         )
//       })
//     // 古いプロパティを削除
//     Object.keys(prevProps)
//       .filter(isProperty)
//       .filter(isGone(prevProps, nextProps))
//       .forEach(name => {
//         dom[name] = ""
//       })

//       // 追加/更新されたプロパティをset
//     Object.keys(nextProps)
//       .filter(isProperty)
//       .filter(isNew(prevProps, nextProps))
//       .forEach(name => {
//         com[name] = nextprops[name]
//       })
//   }

//   function render(element, container) {
//     wipRoot = {
//       dom: container,
//       props: {
//         children: [element]
//       },
//       alternate: currentRoot
//     }
//     deletions = []
//     nextUnitOfWork = wipRoot
//   }

//   function commitRoot() {
//     commitWork(wipRoot.child)
//     wipRoot = null
//   }

//   function commitWork(fiber) {
//     if (!fiber) {
//       return
//     }

//     let domParentFiber = fiber.parent
//     while (!domParentFiber.dom) {
//       domParentFiber = domParentFiber.parent
//     }
//     const domParent = domParentFiber.dom

//     const domParent = fiber.parent.dom
//     if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
//       domParent.appendChild(fiber.dom)
//     } else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
//       updateDom(fiber.dom, fiber.alternate.props, fiber.props)
//     } else if (fiber.effectTag === "DELETION") {
//       domParent.removeChild(fiber.dom)
//     }
    
//     commitWork(fiber.child)
//     commitWork(fiber.sibling)
//   }

//   let currentRoot = null
//   let wipRoot = null
//   let nextUnitOfWork = null
//   let deletions = null
//   function workLoop(deadline) {
//     let shouldYield = false
//     while (nextUnitOfWork && !shouldYield) {
//       nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
//       shouldYield = deadline.timeRemaining() < 1
//     }

//     if (!nextUnitOfWork && wipRoot) {
//       commitRoot()
//     }
//     requestIdleCallback(workLoop)
//   }

//   requestIdleCallback(workLoop)

//   function performUnitOfWork(fiber) {
//     const isFunctionComponent = fiber.type instanceof Function
//     if (isFunctionComponent) {
//       updateFunctionComponent(fiber)
//     } else {
//       updateHostComponent(fiber)
//     }

//     // Create element's DOM
//     if (!fiber.dom) {
//       fiber.dom = createDom(fiber)
//     }

//     // Remove because render real DOM at this point.
//     // Appent DOM to parent
//     // if (fiber.parent) {
//     //   fiber.parent.dom.appendChild(fiber.dom)
//     // }

//     const elements = fiber.props.children
//     // let index = 0
//     // // Prev sibling is elements that is rendered by prev below loop.
//     // let prevSibling = null

//     // // Do for each children elements.
//     while (index < elements.length) {
//     //   const element = elements[index]
//     //   // Create new fiber 
//     //   // The reason is newFiber.dom is null that adove createDOM()
//     //   const newFiber = {
//     //     type: element.type,
//     //     props: element.props,
//     //     parent: fiber,
//     //     dom: null
//     //   }

//     //   // 最初の子要素であればchild
//     //   if (index === 0) {
//     //     fiber.child = newFiber
//     //   }
//     //   // If index !== 0 , prevSibling is not null always.
//     //   else {
//     //     prevSibling.sibling = newFiber
//     //   }

//       // Prevsibling should be prev element
//       // prevSibling = newFiber
//       // index++

//       // 子要素、兄弟、おじの順で処理
//       if (fiber.child) {
//         return fiber.child
//       }
//       let nextFiber = fiber
//       while (nextFiber) {
//         if (nextFiber.sibling) {
//           return nextFiber.sibling
//         }
//         nextFiber = nextFiber.parent
//       }
//     }
//   }

//   let wipFiber = null
//   let hookIndex = null
//   function updateFunctionComponent(fiber) {
//     wipFiber = fiber
//     hookIndex = 0
//     wipFiber.hooks = []
//     const children = [fiber.type(fiber.props)]
//     reconcileChildren(fiber, children)
//   }

//   function useState(initial) {
//     const oldHook = wipFiber.alternate && wipFiber.alternate.hooks && wipFiber.alternate.hooks[hookIndex]
//     const hook = {
//       state: oldHook ? oldHook.state : initial
//     }

//     const setState = action => {
//       hook.queue.push(action)
//       wipRoot = {
//         dom: currentRoot.dom,
//         props: currentRoot.props,
//         alternate: currentRoot,
//       }
//       nextUnitOfWOrk = wipRoot
//       deletions = []
//     }

//     const actions = oldHook ? oldHook.queue : []
//     actions.forEach(action => {
//       hook.state = action(hook.state)
//     })

//     wipFiber.hooks.push(hook)
//     hookIndex++
//     return [hook.state]
//   }

//   function updateHostComponent(fiber) {
//     if (!fiber.dom) {
//       fiber.dom = createDom(fiber)
//     }
//     reconcileChildren(fiber, fiber.props.children)
//   }

//   function reconcileChildren(wipFiber, elements) {
//     let index = 0
//     let oldFiber = wipFiber.alternate && wipFiber.alternate.child
//     // Prev sibling is elements that is rendered by prev below loop.
//     let prevSibling = null

//     // Do for each children elements.
//     while (index < elements.length) {
//       const element = elements[index]
//       let newFiber = null
//       // Create new fiber 
//       // The reason is newFiber.dom is null that adove createDOM()
//       // const newFiber = {
//       //   type: element.type,
//       //   props: element.props,
//       //   parent: fiber,
//       //   dom: null
//       // }

//       const sameType = oldFiber && element && element.type === oldFiber.type

//       if (sameType) {
//         // update node
//         newFiber = {
//           type: oldFiber.type,
//           props: element.props,
//           dom: oldFiber.dom,
//           parent: wipFiber,
//           alternate: oldFiber,
//           effectTag: "UPDATE"
//         }
//       }

//       if (element && !sameType) {
//         newFiber = {
//           type: element.type,
//           props: element.props,
//           dom: null,
//           parent: wipFiber,
//           alternate: null,
//           effectTag: "PLACEMENT",
//         }
//       }

//       if (oldFiber && !sameType) {
//         oldFiber.effectTag = "DELETION"
//         deletions.push(oldFiber)
//       }

//       if (oldFiber) {
//         oldFiber = oldFiber.sibling
//       }

//       // 最初の子要素であればchild
//       if (index === 0) {
//         fiber.child = newFiber
//       }
//       // If index !== 0 , prevSibling is not null always.
//       else {
//         prevSibling.sibling = newFiber
//       }

//       prevSibling = newFiber
//       index++
//     }
//   }

//   const Didact = {
//     createElement,
//     render
//   }

//   /** @jsx Didact.createElement */
//   const element = (
//     <div id="foo">
//       <a>bar</a>
//       <b />
//     </div>
//   )
//   const container = document.getElementById('root')
//   Didact.render(element, container)
// })()