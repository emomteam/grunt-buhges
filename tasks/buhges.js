/*
 * grunt-buhges
 * 
 *
 * Copyright (c) 2013 Ilya Rogov
 * Licensed under the MIT license.
 */

'use strict';



module.exports = function(grunt) {

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  grunt.registerMultiTask('buhges', 'Your task description goes here.', function() {
    // Merge task-specific and/or target-specific options with these defaults.
    var hogan = require('hogan.js'), fs = require('fs');
    var options = this.options({
      src: '.',
      dist: '.',
      save_snippet: false
    });

    var context = {}, snippets;
    var snippets_path = options.src + '/snippets/';
    var layouts_path = options.src + '/layouts/';
    var pages_path = options.src + '/pages/';

    // retrieve layouts
    fs.readdirSync(layouts_path).forEach(function (layout) {

      if (!layout.match(/\.hbs$/)) {
        return;
      }

      var page_layout = fs.readFileSync(layouts_path + layout, 'utf-8');
      layout = layout.replace(/\.hbs/, '');

      // retrieve pages
      fs.readdirSync(pages_path + layout).forEach(function (page) {

        if (!page.match(/\.hbs$/)) {
          return;
        }

        var page_template = fs.readFileSync(pages_path + layout + '/' + page, 'utf-8'), page_name = page.replace(/\.hbs/, '');

        context.title = page_name;
        context.active = page_name;

        if(!snippets) {
          snippets = getSnippets(snippets_path, page_name, true);
        }

        var content = hogan.compile(page_template);
        snippets.content = content.render(context, snippets);

        page = hogan.compile(page_layout);
        page = page.render(context, snippets);

        //fs.writeFileSync(options.dist  + '/' + page_name + '.html', page, 'utf-8');
        // Write the destination file.
        grunt.file.write(options.dist  + '/' + page_name + '.html', page, 'utf-8');
      });
    });

    function getSnippets (snippets_path, page_active, snippets_in_snippet) {

      var snippets = {};

      // retrieve main name snippet
      fs.readdirSync(snippets_path).forEach(function (snippet) {

        // retrieve snippet
        fs.readdirSync(snippets_path + snippet).forEach(function (file_snippet) {

          if (!file_snippet.match(/\.hbs$/) && !file_snippet.match(/\.html$/)) {
            return;
          }

          var name = file_snippet.replace(/\.hbs/, '').replace(/\.html/, '');
          var snippet_path = snippets_path + snippet + '/';
          var template_src = fs.readFileSync(snippet_path + file_snippet, 'utf-8'), data = {};

          if (fs.existsSync(snippet_path + 'data/'  + name + '.json')) {
            data = JSON.parse(fs.readFileSync(snippet_path + 'data/' + name + '.json', 'utf-8'));
          }

          data.active = page_active;

          if(snippet !== name) {
            name = snippet + '_' + name;
          }

          var template = hogan.compile(template_src);

          if(snippets_in_snippet) {
            var snippets_in = getSnippets(snippets_path, page_active, false);
            snippets[name] =  template.render(data, snippets_in);
          } else {
            snippets[name] =  template.render(data);
          }

          if(options.save_snippet && file_snippet.match(/\.hbs$/)) {
            fs.writeFileSync(snippet_path  + file_snippet.replace(/\.hbs/, '') + '.html', snippets[name], 'utf-8');
          }

        });
      });

      return snippets;
    }
  });

};

