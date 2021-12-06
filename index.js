(() => {
  // const element = React.createElement(
  //   'h1',
  //   {
  //     title: 'foo'
  //   },
  //   'hello'
  // )
  const element = {
    type: 'h1',
    props: {
      title: 'foo',
      children: 'Hello'
    }
  }

  const node = document.createElement(element.type)
  node['title'] = element.props.title

  const text = document.createTextNode('')
  text['nodeValue'] = element.props.children

  const container = document.getElementById('root')
  node.appendChild(text)
  container.appendChild(node)
})()